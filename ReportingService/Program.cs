using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Previewer;
using Dapper;
using MySqlConnector;
using System.Data;
using System.Globalization;
using System.Linq;

// Setting QuestPDF license
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReact");
app.UseHttpsRedirection();

app.MapGet("/api/reports/student/{id}", async (int id) =>
{
    var rawConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
    if (string.IsNullOrEmpty(rawConnectionString))
    {
        return Results.Problem("DB_CONNECTION_STRING environment variable is missing.");
    }

    // Ensure we are compatible with Aiven's requirement but also don't fail on strict SSL verification if certs are missing in container
    string connectionString = rawConnectionString;
    if (!connectionString.Contains("SslMode", StringComparison.OrdinalIgnoreCase))
    {
        connectionString += ";SslMode=VerifyCA;"; 
    }

    Console.WriteLine($"[INFO] Connecting to Database: {connectionString.Split(';').FirstOrDefault(p => p.StartsWith("Server"))}...");

    try 
    {
        using IDbConnection db = new MySqlConnection(connectionString);
        
        // TEST CONNECTION FIRST
        try 
        {
            db.Open();
            Console.WriteLine("[INFO] Database Connection Successful.");
        }
        catch (MySqlException ex)
        {
            Console.WriteLine($"[ERROR] Database Connection Failed: {ex.Message}");
            return Results.Problem($"Database Connection Failed: {ex.Message}. Check your Railway Variables.");
        }

        var student = await db.QueryFirstOrDefaultAsync<StudentDto>("SELECT name, department FROM users WHERE id = @id", new { id });
        
        if (student == null) 
        {
            Console.WriteLine($"[WARN] Student {id} not found in 'users' table.");
            return Results.NotFound($"Student {id} not found. Ensure the 'users' table exists and has data.");
        }

    var marksList = (await db.QueryAsync<MarkRecord>(@"
        SELECT 
            s.name AS SubjectName,
            m.obtained_marks AS Marks,
            a.total_marks AS TotalMarks,
            m.grade AS Grade,
            a.name AS AssessmentName
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        JOIN assessments a ON m.assessment_id = a.id
        WHERE m.student_id = @id", new { id })).ToList();

    // Data Normalization & Stats
    var textInfo = System.Globalization.CultureInfo.CurrentCulture.TextInfo;
    string capitalizedName = textInfo.ToTitleCase(student.Name.ToLower());
    string department = student.Department == "-" ? "General" : student.Department;
    
    double totalObtained = marksList.Sum(m => m.Marks);
    double totalMax = marksList.Sum(m => m.TotalMarks);
    double overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    // Performance Trend Summary message
    string summaryMessage = "Based on your current assessments, ";
    if (overallPercentage >= 85) summaryMessage += "your performance is Outstanding! You have demonstrated exceptional understanding of the subjects. Keep maintaining this excellence.";
    else if (overallPercentage >= 70) summaryMessage += "you are showing consistent Good progress. Your grasp of the core concepts is solid. Aim for the next level in upcoming tests.";
    else if (overallPercentage >= 50) summaryMessage += "your performance is Satisfactory. While you are passing, there is significant room for improvement in technical depth. Focus on active review.";
    else summaryMessage += "your current performance is Below Average. We recommend reaching out to your faculty for additional guidance and focusing on the basics.";

    var document = Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(1.5f, Unit.Centimetre);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(11));

            // HEADER
            page.Header().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("ACADEMIC PERFORMANCE REPORT").SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);
                    col.Item().PaddingVertical(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                    col.Item().Text(capitalizedName).Bold().FontSize(26).FontColor(Colors.Black);
                });

                row.ConstantItem(100).AlignRight().Column(col => 
                {
                    col.Item().Text("TRACKER").FontSize(16).Bold().FontColor(Colors.Blue.Medium);
                    col.Item().Text("SAPT System").FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });

            // CONTENT
            page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
            {
                // Profile Section
                col.Item().PaddingVertical(10).Background(Colors.Grey.Lighten4).Padding(10).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Student Details").SemiBold().FontSize(12).FontColor(Colors.Grey.Darken2);
                        c.Item().Text(x => { x.Span("Department: ").SemiBold(); x.Span(department); });
                        c.Item().Text(x => { x.Span("Student ID: ").SemiBold(); x.Span(id.ToString()); });
                    });

                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Report Information").SemiBold().FontSize(12).FontColor(Colors.Grey.Darken2).AlignRight();
                        c.Item().Text($"Date: {DateTime.Now:MMMM dd, yyyy}").AlignRight();
                        c.Item().Text($"Overall Score: {overallPercentage:F1}%").Bold().AlignRight();
                    });
                });

                // Table Sections by Subject
                var groupedMarks = marksList
                    .GroupBy(m => m.SubjectName)
                    .OrderBy(g => g.Key);

                foreach (var subjectGroup in groupedMarks)
                {
                    col.Item().PaddingTop(15).Column(section =>
                    {
                        section.Item().Row(r =>
                        {
                            r.AutoItem().PaddingRight(5).Text(textInfo.ToTitleCase(subjectGroup.Key.ToLower())).Bold().FontSize(14).FontColor(Colors.Blue.Darken2);
                            r.RelativeItem().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Blue.Lighten4);
                        });

                        section.Item().PaddingTop(5).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Assessment
                                columns.RelativeColumn(2); // Score
                                columns.RelativeColumn(1); // Grade
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Assessment");
                                header.Cell().Element(CellStyle).Text("Score");
                                header.Cell().Element(CellStyle).Text("Grade");

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.DefaultTextStyle(x => x.SemiBold().FontColor(Colors.White))
                                                    .Background(Colors.Blue.Darken1)
                                                    .PaddingVertical(5)
                                                    .PaddingHorizontal(5);
                                }
                            });

                            int rowIndex = 0;
                            foreach (var mark in subjectGroup)
                            {
                                bool isEven = rowIndex % 2 == 0;
                                IContainer MarkCellStyle(IContainer container) => container
                                    .Background(isEven ? Colors.White : Colors.Grey.Lighten5)
                                    .PaddingVertical(5)
                                    .PaddingHorizontal(5)
                                    .BorderBottom(1)
                                    .BorderColor(Colors.Grey.Lighten3);

                                table.Cell().Element(MarkCellStyle).Text(textInfo.ToTitleCase(mark.AssessmentName.ToLower()));
                                table.Cell().Element(MarkCellStyle).Text($"{mark.Marks} / {mark.TotalMarks}");
                                table.Cell().Element(MarkCellStyle).Text(mark.Grade).Bold();
                                
                                rowIndex++;
                            }
                        });
                    });
                }

                // Summary Section
                col.Item().PaddingTop(30).Column(c => 
                {
                    c.Item().Text("Performance Analysis").SemiBold().FontSize(14).Underline();
                    c.Item().PaddingTop(5).Text(summaryMessage).Italic().FontColor(Colors.Grey.Darken3);
                });
            });

            // FOOTER
            page.Footer().AlignCenter().Column(f => 
            {
                f.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                f.Item().PaddingTop(5).Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
                f.Item().Text("This is an electronically generated report from Student Assessment & Performance Tracker (SAPT).").FontSize(8).FontColor(Colors.Grey.Medium);
            });
        });
    });

    byte[] pdfBytes = document.GeneratePdf();
    return Results.File(pdfBytes, "application/pdf", $"{capitalizedName}_Academic_Report.pdf");
    
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[CRITICAL ERROR] {ex}");
        return Results.Problem($"Server Error during Report Generation: {ex.Message}");
    }
});

app.Run();

public record StudentDto(string Name, string Department);
public record MarkRecord(string SubjectName, double Marks, double TotalMarks, string Grade, string AssessmentName);
