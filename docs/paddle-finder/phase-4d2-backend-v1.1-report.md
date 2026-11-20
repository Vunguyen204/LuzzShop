# LuzzShop Paddle Finder — Phase 4D.2 Backend v1.1

Ngày hoàn thành: 2026-11-20 (Asia/Saigon)  
Phạm vi: Backend và kiểm thử trên database clone độc lập  
Production `luzzshop`: **không chạy migration, không ghi dữ liệu**

## 1. Kết quả

Backend Paddle Specs đã được refactor theo policy Specification-first, Radar-optional:

- `VERIFIED` chỉ xác nhận các technical facts đã nhập được nguồn VERIFIED hỗ trợ.
- Admin có thể dùng `Xác nhận thông số` trực tiếp; không bắt buộc tự gửi duyệt rồi tự duyệt.
- Lưu vẫn không tự xác nhận. Xác nhận lưu `reviewed_by_user_id` và `reviewed_at`.
- Radar được phép để trống hoàn toàn hoặc một phần và không chặn xác minh kỹ thuật.
- Tách `technical_verified`, `recommendation_eligible`, `radar_ready` và `finder_ready`.
- Tách technical completeness, technical evidence coverage, Radar coverage và Radar confidence.
- Finder-ready không phụ thuộc Radar; vẫn phụ thuộc điều kiện gợi ý, trạng thái sản phẩm, giá và tồn kho.
- Mọi mutation nhiều bước dùng transaction, parameterized query và đọc lại database sau trigger.
- Giữ endpoint submit/review cũ để tương thích và mở rộng quy trình nhiều người duyệt sau này.

## 2. File Backend thay đổi/tạo

- `Backend/config/paddleRubric.js`
- `Backend/validators/paddleSpecValidator.js`
- `Backend/repositories/paddleSpecRepository.js`
- `Backend/services/paddleSpecService.js`
- `Backend/services/paddleQualityService.js`
- `Backend/controllers/paddleSpecController.js`
- `Backend/routes/paddleSpecRoutes.js`
- `Backend/test/paddleSpec.integration.test.js`

Migration 002 UP/DOWN vẫn là bản nháp đã rehearsal; Phase 4D.2 không áp dụng hoặc thay đổi schema production.

## 3. API và workflow

Endpoint mới cho quy trình một Admin:

```http
POST /api/admin/paddle-specs/:productId/confirm
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "review_note": "Đã đối chiếu thông số với nguồn"
}
```

`review_note` là tùy chọn khi xác nhận. Backend chỉ xác nhận khi:

- có ít nhất một technical fact;
- có ít nhất một nguồn kỹ thuật VERIFIED;
- từng technical field khác `NULL` được ít nhất một nguồn VERIFIED khai báo trong `supported_fields`;
- không còn nguồn PENDING liên quan đến technical facts đã nhập.

Response tiếp tục giữ `quality.completeness`, `quality.finder_ready`, `quality.missing`, `quality.breakdown` và bổ sung:

```json
{
  "quality": {
    "technical_verified": true,
    "recommendation_eligible": true,
    "radar_ready": false,
    "finder_ready": true,
    "technical_completeness": 100,
    "technical_evidence_coverage": 100,
    "radar_coverage": 0,
    "radar_confidence": "UNSCORABLE",
    "radar_status": "UNSCORED",
    "technical_evidence": {
      "can_confirm": true,
      "covered_fields": [],
      "uncovered_fields": [],
      "blockers": []
    },
    "radar": {
      "status": "UNSCORED",
      "ready": false,
      "missing_axes": ["power", "control", "spin", "forgiveness", "maneuverability", "comfort"]
    },
    "recommendation_policy": {
      "version": "spec-v1.1-provisional",
      "status": "PROVISIONAL"
    }
  }
}
```

`quality.missing` không chứa các trục Radar thiếu vì Radar không phải điều kiện Finder. Chi tiết Radar thiếu nằm ở `quality.radar.missing_axes`.

## 4. Rubric và dữ liệu cũ

- Ghi/chỉnh Radar mới chỉ chấp nhận rubric v1.1 với các mốc 10/30/50/70/90.
- Mỗi trục có điểm cần band đúng, reason, sourceIds, method và confidence.
- Confidence LOW/MEDIUM cần nêu limitations; Radar READY cần đủ 6/6 và confidence tổng tối thiểu MEDIUM.
- Nguồn được rationale tham chiếu phải VERIFIED và hỗ trợ đúng field điểm của trục.
- Dữ liệu v1.0 có sẵn vẫn được đọc, không rewrite và không làm mất technical VERIFIED.
- Radar v1.0 trả `LEGACY_REVIEW_REQUIRED`, không tự nâng confidence lên MEDIUM.
- API từ chối tạo/chỉnh scoring set dưới v1.0; khi sửa phải chuyển toàn bộ sang v1.1.

## 5. Invalidation

Với trigger migration 002:

- sửa technical fact làm VERIFIED chuyển `IN_REVIEW`;
- thêm/sửa/xóa/từ chối nguồn hỗ trợ technical field làm mất hiệu lực xác minh;
- sửa Radar hoặc nguồn Radar-only không làm mất technical VERIFIED;
- mọi response sau mutation đọc lại trạng thái thực tế từ database.

Backend còn giữ logic reset `REJECTED → DRAFT` khi Admin sửa technical fact hoặc nguồn kỹ thuật. Mutation Radar-only không reset trạng thái kỹ thuật bị từ chối.

## 6. Recommendation eligibility

Điều kiện hiện tại được đánh dấu rõ là **PROVISIONAL**, lấy từ bộ ứng viên policy v1.1 để phục vụ dry-run:

- technical VERIFIED và evidence coverage 100%;
- có khoảng trọng lượng;
- có độ dày lõi;
- có ít nhất hai trường kích thước/hình dáng;
- có ít nhất một trường vật liệu/kết cấu.

Đây chưa phải ngưỡng production cố định. Cần khảo sát/dry-run đủ 17 sản phẩm và phê duyệt policy version trước khi xây Recommendation Engine. API công khai version/status để tránh coi đây là quyết định ngầm.

## 7. Kiểm thử

Database test được tạo động theo mẫu `luzzshop_paddle_it_<pid>_<timestamp>`, cài migration 001 rồi migration 002, dùng fixture tổng hợp và được xóa sau suite. Không dùng hoặc ghi vào `luzzshop`.

Kết quả cuối:

- Paddle Specs integration: **9/9 PASS**.
- Toàn Backend: **15/15 PASS**.
- Order/inventory regression: **6/6 PASS**.
- Syntax check các file Backend thay đổi: PASS.

Các case đã kiểm tra:

- auth/authorization Admin;
- category guard và UNIQUE một spec/product;
- xác nhận trực tiếp không cần Radar;
- nguồn PENDING chặn xác nhận;
- thiếu bằng chứng không thể VERIFIED;
- Radar UNSCORED/PARTIAL/READY;
- Radar edit không hủy technical VERIFIED dưới migration 002;
- technical fact/source mutation hủy xác nhận;
- source REJECTED làm evidence coverage giảm;
- Finder-ready độc lập Radar và phụ thuộc stock;
- đọc v1.0 legacy, từ chối ghi mới v1.0;
- lỗi validation không lộ SQL.

Migration 002 trước đó đã rehearsal riêng **21/21 PASS** trên MariaDB 11.5.2; integration Phase 4D.2 tiếp tục xác minh Backend vận hành với đúng trigger 002.

## 8. Giới hạn còn lại

Schema nguồn chỉ lưu danh sách field được hỗ trợ, không lưu từng giá trị được trích dẫn theo nguồn. Vì vậy Backend có thể phát hiện field chưa được nguồn hỗ trợ hoặc nguồn còn PENDING, nhưng chưa thể tự động phát hiện hai nguồn VERIFIED công bố hai giá trị khác nhau. Xung đột ngữ nghĩa vẫn cần Admin đối chiếu; nếu cần enforcement máy đọc được trong tương lai phải thiết kế dữ liệu evidence theo giá trị hoặc conflict record riêng.

Recommendation policy vẫn PROVISIONAL cho đến khi dry-run 17 sản phẩm được phê duyệt.

## 9. Tác động Frontend 4D.4

Chưa sửa Frontend trong Phase 4D.2. Lần triển khai sau cần:

- nút `Xác nhận thông số`, không bắt buộc submit/review;
- hiển thị riêng bốn trạng thái và bốn chỉ số chất lượng;
- form Radar v1.1 và trạng thái legacy;
- ánh xạ nhãn/tooltips/thông báo tiếng Việt tập trung;
- hiển thị `NULL` là `Chưa có dữ liệu`, không đổi thành 0;
- reload response sau mọi mutation để phản ánh trigger.

## 10. Điều kiện triển khai production an toàn

Backend v1.1 **không được chạy phục vụ production khi `luzzshop` còn trigger 001**. Trigger 001 sẽ hủy VERIFIED khi sửa Radar, source Radar-only hoặc cache completeness, trái policy và response mới.

Deployment phải phối hợp trong cùng maintenance window:

1. xác minh backup/restore gần nhất và chụp row count;
2. dừng mutation Paddle Specs;
3. xác minh đúng database `luzzshop` và bốn trigger 001 hiện tại;
4. áp dụng migration 002 theo checklist đã phê duyệt;
5. xác minh đủ bốn trigger 002 và không đổi schema/row count;
6. triển khai Backend v1.1 ngay trong cùng cửa sổ;
7. smoke test read-only và các thao tác test được phê duyệt;
8. mở lại Admin sau khi cả migration và Backend đều đúng version.

Không tự động chạy DOWN trên production nếu có lỗi. Do DDL MariaDB implicit commit, phải dừng, ghi nhận trigger thực tế và xử lý theo kế hoạch khôi phục được phê duyệt.
