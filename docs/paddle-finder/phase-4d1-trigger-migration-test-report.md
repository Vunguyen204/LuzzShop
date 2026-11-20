# LuzzShop Paddle Finder — Phase 4D.1 Trigger Migration Test Report

Ngày kiểm thử: 2026-11-19 (Asia/Saigon)  
Kết quả cuối: **21/21 PASS**  
Production migration: **chưa chạy**

## 1. Phạm vi

Migration `002` chỉ thay thế bốn trigger invalidation hiện có. Không tạo, xóa hoặc sửa bảng/cột/index/FK/CHECK/UNIQUE và không cập nhật dữ liệu.

Mục tiêu:

- Radar score/rationale/rubric và nguồn chỉ hỗ trợ Radar không làm mất trạng thái xác minh kỹ thuật.
- Technical fact và nguồn hỗ trợ technical field vẫn làm VERIFIED chuyển về IN_REVIEW.
- DOWN khôi phục đúng hành vi trigger legacy của Phase 3C.
- Bản ghi rubric v1.0 không bị biến đổi khi chạy UP.

Sau quyết định Specification-first, Radar-optional, migration vẫn phù hợp về nguyên tắc: technical approval chỉ bị invalidation bởi technical facts/sources. Migration không định nghĩa recommendation eligibility; phần này thuộc Backend service.

## 2. Database và an toàn

- Server: MariaDB `11.5.2-MariaDB`.
- Database chính `luzzshop` chỉ được đọc để clone schema/data và so sánh row count trước/sau.
- Clone cuối: `luzzshop_policy_test_20261118171612`.
- `SELECT DATABASE()` trả đúng tên clone trước khi chạy SQL.
- Tên clone phải khớp `^luzzshop_policy_test_\d{14}$` và không được bằng `luzzshop`.
- Clone đã được xóa sau test; kiểm tra cuối trả `cloneExistsAfterCleanup = false`.
- Không chạy migration 002, migration DOWN hoặc fixture trên `luzzshop`.

Timestamp trong tên clone dùng UTC của runtime để đảm bảo tính duy nhất; ngày báo cáo dùng Asia/Saigon.

## 3. Kết quả cuối

| # | Kiểm thử | Kết quả |
|---:|---|---|
| 1 | Kết nối xác nhận đúng clone độc lập | PASS |
| 2 | Clone đủ 17 bảng production | PASS |
| 3 | UP giữ nguyên bản ghi rubric v1.0 và trạng thái VERIFIED | PASS |
| 4 | UP không đổi định nghĩa hai bảng Paddle | PASS |
| 5 | UP không đổi row count | PASS |
| 6 | UP cài đúng bốn trigger | PASS |
| 7 | Sửa Radar score không làm mất VERIFIED kỹ thuật | PASS |
| 8 | Sửa rubric/rationale không làm mất VERIFIED kỹ thuật | PASS |
| 9 | Sửa technical fact làm VERIFIED về IN_REVIEW | PASS |
| 10 | Thêm nguồn chỉ hỗ trợ Radar không invalidation kỹ thuật | PASS |
| 11 | Sửa nguồn chỉ hỗ trợ Radar không invalidation kỹ thuật | PASS |
| 12 | Xóa nguồn chỉ hỗ trợ Radar không invalidation kỹ thuật | PASS |
| 13 | Thêm nguồn technical làm invalidation | PASS |
| 14 | Sửa nguồn technical làm invalidation | PASS |
| 15 | Xóa nguồn technical làm invalidation | PASS |
| 16 | Đổi source coverage từ Radar-only sang technical làm invalidation | PASS |
| 17 | DOWN không đổi định nghĩa hai bảng | PASS |
| 18 | DOWN khôi phục đúng bốn trigger legacy | PASS |
| 19 | DOWN khôi phục hành vi sửa score sẽ invalidation | PASS |
| 20 | DOWN khôi phục hành vi mọi source insert sẽ invalidation | PASS |
| 21 | Row count của cả 17 bảng production không đổi | PASS |

## 4. Lịch sử một lỗi test đã sửa

Một lượt rehearsal mở rộng báo FAIL ở phép so sánh DDL sau DOWN. Nguyên nhân là fixture clone đã làm tăng bộ đếm `AUTO_INCREMENT`, khiến chuỗi `SHOW CREATE TABLE` khác nhau dù cấu trúc bảng không đổi.

Harness được sửa để chỉ chuẩn hóa giá trị bộ đếm `AUTO_INCREMENT`; toàn bộ phần còn lại của DDL vẫn phải khớp. Lượt chạy cuối PASS 21/21. Clone của lượt lỗi cũng đã được cleanup. Đây không phải lỗi migration.

## 5. Tương thích rubric v1.0

UP được thử với một fixture clone VERIFIED dùng `rubric_version = v1.0`. Sau UP:

- Status, reviewer, reviewed time, completeness và score không đổi.
- Không rewrite `score_rationale`.
- Không tự thêm confidence hoặc nâng version.

Migration trigger vì vậy tương thích dữ liệu v1.0 ở cấp database. Tuy nhiên Backend refactor phải áp dụng policy chuyển tiếp: v1.0 thiếu confidence không được tự coi là đạt MEDIUM cho Finder v1.1.

## 6. Đánh giá migration

Migration tương thích MariaDB 11.5.2. `JSON_CONTAINS` + `JSON_QUOTE` hoạt động với JSON array trong `supported_fields`.

Rủi ro còn lại:

- DDL MariaDB implicit commit; việc drop/create trigger không atomic.
- Nếu UP dừng giữa chừng, số trigger có thể tạm thời nhỏ hơn bốn. Khi triển khai phải chạy statement-by-statement và dừng báo cáo trạng thái thực tế nếu lỗi.
- Trigger chỉ bảo vệ technical VERIFIED. Tính lại recommendation eligibility, Radar và Finder phải được Backend thực hiện transactionally trước khi migration production được áp dụng cùng runtime mới.
- Không nên áp dụng migration 002 trước Backend refactor vì Backend 4A hiện vẫn hiểu VERIFIED theo policy v1.0.

Kết luận: migration nháp **đạt rehearsal clone**, nhưng **chưa sẵn sàng chạy production độc lập**. Cần hoàn tất và kiểm thử Backend v1.1 trước, sau đó lập checklist deployment phối hợp.

## 7. Kế hoạch refactor Backend

### 7.1 Config và policy

`Backend/config/paddleRubric.js`:

- Hỗ trợ đọc v1.0 và v1.1.
- Thêm band → điểm chuẩn 10/30/50/70/90.
- Thêm confidence `HIGH`, `MEDIUM`, `LOW`, `UNSCORABLE`.
- Thêm method và dependency map theo từng trục.

### 7.2 Validator

`Backend/validators/paddleSpecValidator.js`:

- Giữ nguyên field API hiện tại.
- Cho rationale v1.1 có `method`, `confidence`, `limitations`.
- Điểm khác NULL phải có band, reason, sourceIds, method và confidence.
- Điểm NULL không được giả lập bằng 0/50.
- Với MVP, score chỉ nhận năm mốc chuẩn khi rubric v1.1.
- Trả stable error/missing codes; message tiếng Việt không lộ tên SQL.

### 7.3 Quality service

Tách `calculateQuality()` thành:

- `calculateTechnicalCompleteness`;
- `calculateTechnicalEvidenceCoverage`;
- `calculateRadarCoverage`;
- `calculateRadarConfidence`;
- `evaluateTechnicalVerification`;
- `evaluateRecommendationEligibility`;
- `evaluateRadarReadiness`;
- `evaluateFinderReadiness`.

Response cũ vẫn giữ `quality.completeness`, `quality.finder_ready`, `quality.missing`, `quality.breakdown`; bổ sung các field v1.1. Trong thời gian chuyển tiếp, `completeness` nên alias `technical_completeness` và được ghi rõ trong API report.

### 7.4 Workflow

- `review(VERIFIED)` chỉ kiểm tra technical evidence coverage 100%, có ít nhất một technical fact và nguồn VERIFIED, không có conflict.
- `updateScores` không reset technical VERIFIED; tính lại Radar trong transaction, giữ nguyên recommendation eligibility/Finder nếu không có technical hoặc commerce change.
- Source mutation phân nhánh theo `supported_fields` technical/Radar.
- Luôn đọc lại database sau trigger.
- Hồ sơ v1.0 giữ nguyên; khi sửa scoring set phải nâng toàn bộ sang v1.1.
- Recommendation eligibility chỉ dùng technical facts VERIFIED; Radar không tham gia điều kiện bắt buộc.
- Finder-ready = recommendation-eligible + active + giá hợp lệ + tồn kho; budget cụ thể lọc theo request.

### 7.5 Test Backend

- VERIFIED kỹ thuật không cần score.
- Advanced fields NULL vẫn VERIFIED.
- Populated technical field thiếu source coverage không VERIFIED.
- 5/6 Radar là PARTIAL nhưng không tự làm mất recommendation/Finder eligibility.
- 6/6 nhưng một LOW không radar-ready, song vẫn có thể recommendation-eligible.
- 6/6 toàn MEDIUM/HIGH là radar-ready.
- Nguồn Radar bị reject làm Radar READY mất hiệu lực nhưng technical VERIFIED và recommendation eligibility giữ nguyên.
- Nguồn technical bị sửa/reject làm technical status về IN_REVIEW.
- Sản phẩm không có Radar nhưng đủ specification vẫn Finder-ready.
- Legacy v1.0 không bị rewrite và không tự đạt confidence MEDIUM.
- Toàn bộ order/inventory regression vẫn PASS.

## 8. Kế hoạch refactor Frontend

### 8.1 Việt hóa tập trung

Tạo một config ánh xạ dùng chung cho:

- Technical fields và đơn vị;
- sáu trục Radar;
- trạng thái hồ sơ/Radar/Finder;
- source type, shape, band, confidence;
- missing code, breakdown và validation code;
- tooltip.

Không hiển thị raw database/API key trong UI. Tên field API và enum nội bộ không đổi.

### 8.2 Danh sách Admin

Hiển thị riêng:

- Xác minh kỹ thuật;
- độ đầy đủ kỹ thuật;
- độ phủ bằng chứng;
- Radar 0–6 trục và confidence;
- Recommendation-eligible;
- Finder-ready.

### 8.3 Trang chi tiết

- Tab kỹ thuật giải thích trường bắt buộc/khuyến nghị/tùy chọn.
- Tab Radar dùng đúng năm mốc v1.1, confidence và limitations.
- Radar không biến NULL thành 0; trục thiếu hiển thị “Chưa có dữ liệu”.
- Tab nguồn hiển thị nhãn Việt của `supported_fields`.
- Tab kiểm duyệt tách “Xác minh kỹ thuật”, “Đủ điều kiện gợi ý”, “Radar sẵn sàng” và “Finder sẵn sàng”.

### 8.4 Test Frontend

- Null khác 0 trên form, bảng và biểu đồ.
- Không còn raw key/enum ở màn hình Admin.
- Score/rationale payload v1.1 đúng API.
- Sau source/score mutation, UI reload dữ liệu và phản ánh invalidation đúng nhánh.
- Loading/error/empty/responsive và build/lint PASS.

## 9. Trình tự triển khai đề xuất

1. Phê duyệt policy và migration nháp.
2. Hoàn thành dry-run availability 17 sản phẩm và phê duyệt eligibility specification-first.
3. Refactor Backend + test trên database test dùng trigger 002.
4. Refactor Frontend + UAT.
5. Backup/restore rehearsal mới và checklist coordinated deployment.
6. Deploy Backend tương thích v1.1 và migration 002 trong cùng maintenance window.
7. Smoke test production không ghi dữ liệu thật ngoài thao tác được phê duyệt.

Không chạy migration 002 production trước bước 4–5.
