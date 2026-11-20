-- LuzzShop - Interactive Paddle Finder
-- Draft migration only. DO NOT execute without approval, backup, and staging verification.
-- Target verified during design: MariaDB 11.5.2, InnoDB, utf8mb4_uca1400_ai_ci.
-- DDL statements in MariaDB cause implicit commits; this file is intentionally fail-fast.

CREATE TABLE paddle_specs (
    paddle_spec_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,

    -- Verified physical/technical facts. Canonical units are encoded in column names.
    static_weight_min_g DECIMAL(6,2) NULL,
    static_weight_max_g DECIMAL(6,2) NULL,
    core_thickness_mm DECIMAL(5,2) NULL,
    paddle_length_mm DECIMAL(6,2) NULL,
    paddle_width_mm DECIMAL(6,2) NULL,
    handle_length_mm DECIMAL(6,2) NULL,
    grip_circumference_mm DECIMAL(6,2) NULL,
    balance_point_mm DECIMAL(6,2) NULL,
    swing_weight DECIMAL(7,2) NULL,
    twist_weight DECIMAL(7,2) NULL,
    face_material VARCHAR(255) NULL,
    core_material VARCHAR(255) NULL,
    construction VARCHAR(255) NULL,
    paddle_shape VARCHAR(30) NULL,

    -- Editorial characteristics assessed with a versioned rubric, not measurements.
    power_score TINYINT UNSIGNED NULL,
    control_score TINYINT UNSIGNED NULL,
    spin_score TINYINT UNSIGNED NULL,
    forgiveness_score TINYINT UNSIGNED NULL,
    maneuverability_score TINYINT UNSIGNED NULL,
    comfort_score TINYINT UNSIGNED NULL,
    score_rationale JSON NULL,
    rubric_version VARCHAR(30) NULL,

    -- Workflow and data-governance metadata.
    verification_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    data_completeness DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    review_note TEXT NULL,
    created_by_user_id INT NULL,
    updated_by_user_id INT NULL,
    reviewed_by_user_id INT NULL,
    submitted_at DATETIME NULL,
    reviewed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_paddle_specs PRIMARY KEY (paddle_spec_id),
    CONSTRAINT uq_paddle_specs_product UNIQUE (product_id),

    CONSTRAINT fk_paddle_specs_product
        FOREIGN KEY (product_id) REFERENCES products (product_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_paddle_specs_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users (user_id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_paddle_specs_updated_by
        FOREIGN KEY (updated_by_user_id) REFERENCES users (user_id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_paddle_specs_reviewed_by
        FOREIGN KEY (reviewed_by_user_id) REFERENCES users (user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT chk_paddle_specs_weight_min CHECK (static_weight_min_g IS NULL OR static_weight_min_g > 0),
    CONSTRAINT chk_paddle_specs_weight_max CHECK (static_weight_max_g IS NULL OR static_weight_max_g > 0),
    CONSTRAINT chk_paddle_specs_weight_range CHECK (
        static_weight_min_g IS NULL OR static_weight_max_g IS NULL OR static_weight_min_g <= static_weight_max_g
    ),
    CONSTRAINT chk_paddle_specs_core_thickness CHECK (core_thickness_mm IS NULL OR core_thickness_mm > 0),
    CONSTRAINT chk_paddle_specs_length CHECK (paddle_length_mm IS NULL OR paddle_length_mm > 0),
    CONSTRAINT chk_paddle_specs_width CHECK (paddle_width_mm IS NULL OR paddle_width_mm > 0),
    CONSTRAINT chk_paddle_specs_handle_length CHECK (handle_length_mm IS NULL OR handle_length_mm > 0),
    CONSTRAINT chk_paddle_specs_handle_vs_length CHECK (
        handle_length_mm IS NULL OR paddle_length_mm IS NULL OR handle_length_mm < paddle_length_mm
    ),
    CONSTRAINT chk_paddle_specs_grip CHECK (grip_circumference_mm IS NULL OR grip_circumference_mm > 0),
    CONSTRAINT chk_paddle_specs_balance CHECK (balance_point_mm IS NULL OR balance_point_mm > 0),
    CONSTRAINT chk_paddle_specs_swing_weight CHECK (swing_weight IS NULL OR swing_weight >= 0),
    CONSTRAINT chk_paddle_specs_twist_weight CHECK (twist_weight IS NULL OR twist_weight >= 0),
    CONSTRAINT chk_paddle_specs_shape CHECK (
        paddle_shape IS NULL OR paddle_shape IN ('STANDARD', 'ELONGATED', 'WIDEBODY', 'HYBRID', 'OTHER')
    ),
    CONSTRAINT chk_paddle_specs_power CHECK (power_score IS NULL OR power_score BETWEEN 0 AND 100),
    CONSTRAINT chk_paddle_specs_control CHECK (control_score IS NULL OR control_score BETWEEN 0 AND 100),
    CONSTRAINT chk_paddle_specs_spin CHECK (spin_score IS NULL OR spin_score BETWEEN 0 AND 100),
    CONSTRAINT chk_paddle_specs_forgiveness CHECK (forgiveness_score IS NULL OR forgiveness_score BETWEEN 0 AND 100),
    CONSTRAINT chk_paddle_specs_maneuverability CHECK (maneuverability_score IS NULL OR maneuverability_score BETWEEN 0 AND 100),
    CONSTRAINT chk_paddle_specs_comfort CHECK (comfort_score IS NULL OR comfort_score BETWEEN 0 AND 100),
    CONSTRAINT chk_paddle_specs_rationale_json CHECK (
        score_rationale IS NULL
        OR (JSON_VALID(score_rationale) AND JSON_TYPE(score_rationale) = 'OBJECT')
    ),
    CONSTRAINT chk_paddle_specs_status CHECK (
        verification_status IN ('DRAFT', 'IN_REVIEW', 'VERIFIED', 'REJECTED')
    ),
    CONSTRAINT chk_paddle_specs_completeness CHECK (data_completeness BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_paddle_specs_review_state CHECK (
        verification_status NOT IN ('VERIFIED', 'REJECTED')
        OR (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT chk_paddle_specs_submit_state CHECK (
        verification_status = 'DRAFT' OR submitted_at IS NOT NULL
    ),

    INDEX idx_paddle_specs_workflow (verification_status, data_completeness),
    INDEX idx_paddle_specs_reviewed_by (reviewed_by_user_id),
    INDEX idx_paddle_specs_updated_at (updated_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_uca1400_ai_ci
  COMMENT='Verified paddle facts and versioned editorial recommendation scores';

CREATE TABLE paddle_spec_sources (
    paddle_spec_source_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    paddle_spec_id BIGINT UNSIGNED NOT NULL,

    source_type VARCHAR(30) NOT NULL,
    source_title VARCHAR(255) NOT NULL,
    source_locator VARCHAR(1000) NOT NULL,
    source_fingerprint BINARY(32) NOT NULL,
    publisher VARCHAR(255) NULL,
    published_at DATE NULL,
    accessed_at DATETIME NOT NULL,
    supported_fields JSON NOT NULL,
    evidence_note TEXT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,

    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by_user_id INT NULL,
    verified_at DATETIME NULL,
    rejection_reason VARCHAR(1000) NULL,
    created_by_user_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_paddle_spec_sources PRIMARY KEY (paddle_spec_source_id),
    CONSTRAINT uq_paddle_spec_sources_fingerprint UNIQUE (paddle_spec_id, source_fingerprint),

    CONSTRAINT fk_paddle_spec_sources_spec
        FOREIGN KEY (paddle_spec_id) REFERENCES paddle_specs (paddle_spec_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_paddle_spec_sources_verified_by
        FOREIGN KEY (verified_by_user_id) REFERENCES users (user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_paddle_spec_sources_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users (user_id)
        ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_paddle_spec_sources_type CHECK (
        source_type IN ('MANUFACTURER', 'AUTHORIZED_DISTRIBUTOR', 'CERTIFIED_DOCUMENT', 'INTERNAL_REVIEW', 'OTHER')
    ),
    CONSTRAINT chk_paddle_spec_sources_title CHECK (CHAR_LENGTH(TRIM(source_title)) > 0),
    CONSTRAINT chk_paddle_spec_sources_locator CHECK (CHAR_LENGTH(TRIM(source_locator)) > 0),
    CONSTRAINT chk_paddle_spec_sources_supported_fields_json CHECK (
        JSON_VALID(supported_fields) AND JSON_TYPE(supported_fields) = 'ARRAY'
    ),
    CONSTRAINT chk_paddle_spec_sources_primary CHECK (is_primary IN (0, 1)),
    CONSTRAINT chk_paddle_spec_sources_status CHECK (
        verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')
    ),
    CONSTRAINT chk_paddle_spec_sources_verified_state CHECK (
        verification_status <> 'VERIFIED'
        OR (verified_by_user_id IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_paddle_spec_sources_rejected_state CHECK (
        verification_status <> 'REJECTED' OR rejection_reason IS NOT NULL
    ),

    INDEX idx_paddle_spec_sources_spec_status (paddle_spec_id, verification_status),
    INDEX idx_paddle_spec_sources_type (source_type),
    INDEX idx_paddle_spec_sources_verified_by (verified_by_user_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_uca1400_ai_ci
  COMMENT='Field-level provenance for paddle specifications and rubric evidence';

-- A verified record must never silently retain approval after governed content changes.
-- These triggers are a database safety net; the future service must still perform the
-- same transition and recalculate completeness in its own transaction.
DELIMITER $$

CREATE TRIGGER trg_paddle_specs_invalidate_before_update
BEFORE UPDATE ON paddle_specs
FOR EACH ROW
BEGIN
    IF OLD.verification_status = 'VERIFIED'
       AND NOT (
           OLD.product_id <=> NEW.product_id
           AND OLD.static_weight_min_g <=> NEW.static_weight_min_g
           AND OLD.static_weight_max_g <=> NEW.static_weight_max_g
           AND OLD.core_thickness_mm <=> NEW.core_thickness_mm
           AND OLD.paddle_length_mm <=> NEW.paddle_length_mm
           AND OLD.paddle_width_mm <=> NEW.paddle_width_mm
           AND OLD.handle_length_mm <=> NEW.handle_length_mm
           AND OLD.grip_circumference_mm <=> NEW.grip_circumference_mm
           AND OLD.balance_point_mm <=> NEW.balance_point_mm
           AND OLD.swing_weight <=> NEW.swing_weight
           AND OLD.twist_weight <=> NEW.twist_weight
           AND OLD.face_material <=> NEW.face_material
           AND OLD.core_material <=> NEW.core_material
           AND OLD.construction <=> NEW.construction
           AND OLD.paddle_shape <=> NEW.paddle_shape
           AND OLD.power_score <=> NEW.power_score
           AND OLD.control_score <=> NEW.control_score
           AND OLD.spin_score <=> NEW.spin_score
           AND OLD.forgiveness_score <=> NEW.forgiveness_score
           AND OLD.maneuverability_score <=> NEW.maneuverability_score
           AND OLD.comfort_score <=> NEW.comfort_score
           AND OLD.score_rationale <=> NEW.score_rationale
           AND OLD.rubric_version <=> NEW.rubric_version
           AND OLD.data_completeness <=> NEW.data_completeness
       )
    THEN
        SET NEW.verification_status = 'IN_REVIEW';
        SET NEW.reviewed_by_user_id = NULL;
        SET NEW.reviewed_at = NULL;
        SET NEW.data_completeness = 0.00;
    END IF;
END$$

CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_insert
AFTER INSERT ON paddle_spec_sources
FOR EACH ROW
BEGIN
    UPDATE paddle_specs
       SET verification_status = 'IN_REVIEW',
           reviewed_by_user_id = NULL,
           reviewed_at = NULL,
           data_completeness = 0.00
     WHERE paddle_spec_id = NEW.paddle_spec_id
       AND verification_status = 'VERIFIED';
END$$

CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_update
AFTER UPDATE ON paddle_spec_sources
FOR EACH ROW
BEGIN
    IF NOT (
        OLD.paddle_spec_id <=> NEW.paddle_spec_id
        AND OLD.source_type <=> NEW.source_type
        AND OLD.source_title <=> NEW.source_title
        AND OLD.source_locator <=> NEW.source_locator
        AND OLD.source_fingerprint <=> NEW.source_fingerprint
        AND OLD.publisher <=> NEW.publisher
        AND OLD.published_at <=> NEW.published_at
        AND OLD.accessed_at <=> NEW.accessed_at
        AND OLD.supported_fields <=> NEW.supported_fields
        AND OLD.evidence_note <=> NEW.evidence_note
        AND OLD.is_primary <=> NEW.is_primary
        AND OLD.verification_status <=> NEW.verification_status
        AND OLD.rejection_reason <=> NEW.rejection_reason
    )
    THEN
        UPDATE paddle_specs
           SET verification_status = 'IN_REVIEW',
               reviewed_by_user_id = NULL,
               reviewed_at = NULL,
               data_completeness = 0.00
         WHERE paddle_spec_id IN (OLD.paddle_spec_id, NEW.paddle_spec_id)
           AND verification_status = 'VERIFIED';
    END IF;
END$$

CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_delete
AFTER DELETE ON paddle_spec_sources
FOR EACH ROW
BEGIN
    UPDATE paddle_specs
       SET verification_status = 'IN_REVIEW',
           reviewed_by_user_id = NULL,
           reviewed_at = NULL,
           data_completeness = 0.00
     WHERE paddle_spec_id = OLD.paddle_spec_id
       AND verification_status = 'VERIFIED';
END$$

DELIMITER ;

