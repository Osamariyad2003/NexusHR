-- =============================================================================
-- NexusHR Enterprise Management System - PostgreSQL Database Schema Baseline
-- Specification Baseline: v1.0.0
-- Compliant with: REQ-EMP-001, REQ-EMP-003, REQ-ATT-001, REQ-LEV-001, BR-TEN-001
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TENANTS TABLE (BR-TEN-001 Tenancy Boundary Isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan VARCHAR(30) NOT NULL DEFAULT 'ENTERPRISE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. DEPARTMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    manager_id UUID, -- Circular ref added later via ALTER TABLE
    headcount_cache INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_dept_code UNIQUE (tenant_id, code)
);

-- -----------------------------------------------------------------------------
-- 3. EMPLOYEES TABLE (REQ-EMP-001, REQ-EMP-003 Soft-Delete Archival Protocol)
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    job_title VARCHAR(100) NOT NULL,
    employment_type VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME', -- FULL_TIME, PART_TIME, CONTRACTOR
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, TERMINATED
    role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE', -- SUPER_ADMIN, HR_MANAGER, PEOPLE_MANAGER, EMPLOYEE
    shift_start_time TIME WITHOUT TIME ZONE DEFAULT '09:00:00',
    shift_end_time TIME WITHOUT TIME ZONE DEFAULT '17:00:00',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_emp_email UNIQUE (tenant_id, email),
    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'))
);

-- Circular FK for department head
ALTER TABLE departments 
    ADD CONSTRAINT fk_dept_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 4. ATTENDANCE RECORDS TABLE (REQ-ATT-001, BR-ATT-001 Punctuality Grace Period)
-- -----------------------------------------------------------------------------
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL, -- PRESENT, LATE, ABSENT, INCOMPLETE_RECONCILIATION
    is_modified BOOLEAN NOT NULL DEFAULT FALSE,
    late_minutes INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_date UNIQUE (employee_id, date),
    CONSTRAINT chk_attendance_status CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE', 'INCOMPLETE_RECONCILIATION'))
);

-- -----------------------------------------------------------------------------
-- 5. LEAVE BALANCES TABLE (REQ-LEV-001 Balance Verification & Lock Guard)
-- -----------------------------------------------------------------------------
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL, -- ANNUAL, SICK, MATERNITY, UNPAID
    annual_accrued INT NOT NULL DEFAULT 20,
    pending_deduction INT NOT NULL DEFAULT 0,
    used_days INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_leave_type UNIQUE (employee_id, leave_type)
);

-- -----------------------------------------------------------------------------
-- 6. LEAVE REQUESTS TABLE (REQ-LEV-001, BR-LEV-001, BR-LEV-002 Anti-Collision)
-- -----------------------------------------------------------------------------
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    reason TEXT NOT NULL,
    rejection_reason TEXT,
    reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_days_positive CHECK (days_requested > 0),
    CONSTRAINT chk_leave_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

-- -----------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE (Append-Only Audit Trail)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id UUID REFERENCES employees(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR P95 LATENCY PERFORMANCE OPTIMIZATION (REQ-EMP-002 <= 150ms)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_emp_tenant_status ON employees(tenant_id, status);
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_emp_fulltext ON employees USING gin (to_tsvector('english', first_name || ' ' || last_name || ' ' || email));

CREATE INDEX idx_att_tenant_date ON attendance_records(tenant_id, date);
CREATE INDEX idx_att_emp_date ON attendance_records(employee_id, date);
CREATE INDEX idx_att_unclosed ON attendance_records(employee_id) WHERE check_out IS NULL;

CREATE INDEX idx_leave_tenant_status ON leave_requests(tenant_id, status);
CREATE INDEX idx_leave_emp_dates ON leave_requests(employee_id, start_date, end_date);
