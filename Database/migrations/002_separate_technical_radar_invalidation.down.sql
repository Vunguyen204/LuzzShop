-- Compensating rollback for migration 002.
-- Restores the original Phase 3C four-trigger behavior exactly: any governed
-- technical, Radar or source change invalidates VERIFIED.
-- NEVER run on production without explicit approval and backup verification.

DROP TRIGGER IF EXISTS trg_paddle_specs_invalidate_before_update;
DROP TRIGGER IF EXISTS trg_paddle_spec_sources_invalidate_after_insert;
DROP TRIGGER IF EXISTS trg_paddle_spec_sources_invalidate_after_update;
DROP TRIGGER IF EXISTS trg_paddle_spec_sources_invalidate_after_delete;

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
       SET verification_status = 'IN_REVIEW', reviewed_by_user_id = NULL,
           reviewed_at = NULL, data_completeness = 0.00
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
    UPDATE paddle_specs
       SET verification_status = 'IN_REVIEW', reviewed_by_user_id = NULL,
           reviewed_at = NULL, data_completeness = 0.00
     WHERE paddle_spec_id = OLD.paddle_spec_id
       AND verification_status = 'VERIFIED';
END$$

DELIMITER ;
