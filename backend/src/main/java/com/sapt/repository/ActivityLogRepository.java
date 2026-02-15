package com.sapt.repository;

import com.sapt.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    @Query("SELECT a FROM ActivityLog a ORDER BY a.id DESC")
    List<ActivityLog> findRecentActivities(org.springframework.data.domain.Pageable pageable);
}
