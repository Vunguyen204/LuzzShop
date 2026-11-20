-- LuzzShop Paddle Finder policy v1.1.
-- Draft only. Replaces four invalidation triggers; no table/column/data changes.
-- Target: MariaDB 11.5.2. DDL implicitly commits.

DROP TRIGGER IF EXISTS trg_paddle_specs_invalidate_before_update;
DROP TRIGGER IF EXISTS trg_paddle_spec_sources_invalidate_after_insert;
DROP TRIGGER IF EXISTS trg_paddle_spec_sources_invalidate_after_update;
DROP TRIGGER IF EXISTS trg_paddle_spec_sources_invalidate_after_delete;

DELIMITER $$

CREATE TRIGGER trg_paddle_specs_invalidate_before_update
BEFORE UPDATE ON paddle_specs
FOR EACH ROW
BEGIN
    -- VERIFIED now governs technical facts only. Score/rationale/rubric edits are
    -- evaluated by the service for Radar/Finder readiness and do not revoke
    -- technical approval.
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
    IF JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('static_weight_min_g'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('static_weight_max_g'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('core_thickness_mm'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('paddle_length_mm'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('paddle_width_mm'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('handle_length_mm'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('grip_circumference_mm'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('balance_point_mm'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('swing_weight'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('twist_weight'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('face_material'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('core_material'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('construction'), '$')
       OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('paddle_shape'), '$')
    THEN
        UPDATE paddle_specs
           SET verification_status = 'IN_REVIEW', reviewed_by_user_id = NULL,
               reviewed_at = NULL, data_completeness = 0.00
         WHERE paddle_spec_id = NEW.paddle_spec_id
           AND verification_status = 'VERIFIED';
    END IF;
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
    ) AND (
        JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('static_weight_min_g'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('static_weight_max_g'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('core_thickness_mm'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('paddle_length_mm'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('paddle_width_mm'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('handle_length_mm'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('grip_circumference_mm'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('balance_point_mm'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('swing_weight'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('twist_weight'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('face_material'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('core_material'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('construction'), '$')
        OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('paddle_shape'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('static_weight_min_g'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('static_weight_max_g'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('core_thickness_mm'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('paddle_length_mm'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('paddle_width_mm'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('handle_length_mm'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('grip_circumference_mm'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('balance_point_mm'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('swing_weight'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('twist_weight'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('face_material'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('core_material'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('construction'), '$')
        OR JSON_CONTAINS(NEW.supported_fields, JSON_QUOTE('paddle_shape'), '$')
    )
    THEN
        UPDATE paddle_specs
           SET verification_status = 'IN_REVIEW', reviewed_by_user_id = NULL,
               reviewed_at = NULL, data_completeness = 0.00
         WHERE paddle_spec_id IN (OLD.paddle_spec_id, NEW.paddle_spec_id)
           AND verification_status = 'VERIFIED';
    END IF;
END$$

CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_delete
AFTER DELETE ON paddle_spec_sources
FOR EACH ROW
BEGIN
    IF JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('static_weight_min_g'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('static_weight_max_g'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('core_thickness_mm'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('paddle_length_mm'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('paddle_width_mm'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('handle_length_mm'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('grip_circumference_mm'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('balance_point_mm'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('swing_weight'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('twist_weight'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('face_material'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('core_material'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('construction'), '$')
       OR JSON_CONTAINS(OLD.supported_fields, JSON_QUOTE('paddle_shape'), '$')
    THEN
        UPDATE paddle_specs
           SET verification_status = 'IN_REVIEW', reviewed_by_user_id = NULL,
               reviewed_at = NULL, data_completeness = 0.00
         WHERE paddle_spec_id = OLD.paddle_spec_id
           AND verification_status = 'VERIFIED';
    END IF;
END$$

DELIMITER ;
