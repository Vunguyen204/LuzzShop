# LuzzShop Paddle Finder — Phase 4D.3 Coordinated Deployment Test Report

Ngày kiểm thử: 2026-11-20 (Asia/Saigon)  
MariaDB: `11.5.2-MariaDB`  
Production: `luzzshop` — **chỉ đọc, không chạy migration, không ghi dữ liệu**

## 1. Kết luận

Backend Paddle Specs v1.1 và migration 002 tương thích khi được triển khai cùng nhau:

- Rehearsal Backend + migration trên clone production: **44/44 PASS**.
- Rehearsal migration UP/DOWN độc lập: **21/21 PASS**.
- Backend integration/regression: **15/15 PASS**.
- Order/inventory regression: **6/6 PASS**.
- Frontend 4B hiện trạng build: **PASS**.
- Production có 17 bảng và bốn trigger Paddle trước kiểm thử; row count của cả 17 bảng không đổi sau kiểm thử.
- Không clone nào còn tồn tại sau cleanup.

Kết luận triển khai: cặp **migration 002 + Backend v1.1 đạt rehearsal kỹ thuật**, nhưng toàn bộ Admin workflow chưa nên phát hành cho người dùng trước khi Frontend 4D.4 được cập nhật hoặc chức năng lưu Radar trên Frontend 4B được tạm khóa. Frontend 4B vẫn gửi payload rubric v1.0 và không có nút `/confirm`.

## 2. Database clone và an toàn

Lượt rehearsal cuối dùng clone:

```text
luzzshop_4d3_test_27732_1795112484235
```

Quy trình:

1. Xác minh `DB_NAME` đúng bằng `luzzshop`.
2. Đọc danh sách bảng và row count production.
3. Tạo clone độc lập với `utf8mb4_uca1400_ai_ci`.
4. Clone schema và dữ liệu của đủ 17 bảng.
5. Đối chiếu row count từng bảng.
6. Áp dụng migration 002 trên clone.
7. Trỏ Backend v1.1 vào đúng clone và khởi động Express trên cổng ngẫu nhiên.
8. Chạy fixture/API chỉ trong clone.
9. Dừng Backend, đóng pool và kiểm tra lại row count production.
10. Chỉ xóa database khớp regex `^luzzshop_4d3_test_\d+_\d+$`.

Kết quả cuối:

- `productionWriteOperations = 0`.
- 17/17 row count production không đổi.
- `cloneExistsAfterCleanup = false`.
- Không ghi dữ liệu giả hoặc thật vào `luzzshop`.

Harness có thể chạy lại tại `Database/tests/phase-4d3-deployment-harness.js`.

## 3. Kết quả workflow Backend v1.1 trên clone production

| Kiểm thử | Kết quả |
|---|---|
| Admin tạo hồ sơ DRAFT | PASS |
| Lưu technical facts | PASS |
| Trường nâng cao không nhập vẫn NULL | PASS |
| Sáu điểm Radar không nhập vẫn NULL | PASS |
| Thêm nguồn technical PENDING | PASS |
| Xác minh nguồn | PASS |
| Xác nhận trực tiếp qua `/confirm` | PASS |
| VERIFIED kỹ thuật khi Radar UNSCORED | PASS |
| Recommendation eligibility không phụ thuộc Radar | PASS |
| Finder-ready không phụ thuộc Radar | PASS |
| Thêm/xác minh nguồn Radar-only không hủy VERIFIED | PASS |
| Lưu một trục Radar v1.1 tạo PARTIAL, coverage 16.67% | PASS |
| Sửa Radar không hủy VERIFIED kỹ thuật | PASS |
| Sửa technical fact đưa hồ sơ về IN_REVIEW | PASS |
| Xác nhận lại sau khi đối chiếu | PASS |
| Sửa nguồn technical đưa hồ sơ về IN_REVIEW | PASS |
| Từ chối nguồn technical làm evidence coverage về 0 | PASS |
| API trả trạng thái database sau trigger | PASS |

Fixture kỹ thuật chỉ dùng trọng lượng, độ dày lõi, chiều dài, chiều rộng và vật liệu mặt. Kết quả xác nhận:

- `technical_verified = true`;
- `technical_evidence_coverage = 100`;
- `technical_completeness = 54`;
- `recommendation_eligible = true` theo policy provisional;
- `finder_ready = true` vì sản phẩm clone đang hoạt động, có giá và tồn kho;
- `radar_status = UNSCORED` trước khi thêm Radar;
- swingweight, twistweight, balance point và sáu điểm Radar đều giữ `NULL`.

Điều này xác nhận completeness không còn là ngưỡng khóa xác minh/Finder. Technical completeness 54% vẫn có thể Finder-ready nếu đủ feature policy và mọi fact đã nhập có evidence coverage 100%.

## 4. Tương thích endpoint cũ và Frontend 4B

### 4.1 Endpoint cũ

| Contract Frontend 4B | Kết quả với Backend v1.1 |
|---|---|
| List Paddle Specs | PASS |
| Detail Paddle Spec | PASS |
| Create spec | PASS |
| Update technical | PASS |
| CRUD/review source | PASS |
| Submit DRAFT/REJECTED → IN_REVIEW | PASS |
| Review IN_REVIEW → VERIFIED | PASS |
| Các field cũ `quality.completeness`, `finder_ready`, `missing`, `breakdown` | Giữ tương thích |
| Ghi Radar bằng payload v1.0 | **FAIL có chủ đích — HTTP 400** |
| Xác nhận trực tiếp `/confirm` | Backend có; Frontend 4B chưa gọi |

Payload Radar v1.0 của Frontend 4B bị từ chối với code:

```json
{
  "message": "Khi tạo hoặc chỉnh sửa điểm Radar, toàn bộ bộ điểm phải dùng rubric v1.1",
  "details": ["radar.rubric_v1_1_required"]
}
```

Đây là bảo vệ dữ liệu đúng policy, không phải lỗi migration. Không nên nới Backend để tiếp tục ghi dữ liệu v1.0.

### 4.2 Sai lệch UX của Frontend 4B

- Chưa có hàm API/nút `Xác nhận thông số` gọi `/confirm`.
- Vẫn yêu cầu workflow `Gửi duyệt → Duyệt VERIFIED` dù Backend đã cho phép xác nhận trực tiếp.
- Tab Radar vẫn ghi “Rubric v1.0”, nhận mọi số nguyên 0–100 và thiếu method/confidence/limitations.
- Mô tả Finder-ready vẫn nói bắt buộc sáu điểm và completeness ≥ 75%; điều này sai với policy v1.1.
- Chỉ hiển thị completeness chung, chưa tách technical completeness/evidence, Radar coverage/confidence và recommendation eligibility.
- Một số nhãn `supported_fields`, breakdown, missing code và enum vẫn hiển thị raw key.
- Thông báo hiện tại nói mọi thay đổi nguồn đều có thể hủy VERIFIED; migration 002 chỉ invalidation nguồn technical.
- Chưa hiển thị rõ legacy `LEGACY_REVIEW_REQUIRED`, Radar `UNSCORED/PARTIAL/READY` và recommendation policy `PROVISIONAL`.

## 5. Regression

`npm test` trong Backend: **15/15 PASS**.

- Paddle Specs: 9/9 PASS.
- Order/inventory: 6/6 PASS.
- Tạo đơn lấy giá database, xác thực variant/stock, chống oversell, hủy/hoàn kho và chuyển trạng thái đơn đều PASS.

Cart và checkout phía Frontend không bị sửa trong Phase 4D.2/4D.3. Payment hiện chưa có backend payment workflow riêng ngoài cột `payment_method`; regression order xác nhận server vẫn ghi `COD` theo logic hiện tại và không tin giá/phương thức do client sửa.

`npm run build` tại Frontend 4B: **PASS**, 157 modules transformed.

## 6. Kế hoạch triển khai đồng bộ

Khuyến nghị hoàn thành Frontend 4D.4 và UAT trước production. Khi được phê duyệt triển khai:

### Trước maintenance window

1. Chốt version/hash của migration 002 và Backend release artifact.
2. Tạo backup mới gồm schema, data, trigger và kiểm thử restore độc lập.
3. Lưu snapshot:
   - `SELECT VERSION()`, `SELECT DATABASE()`;
   - danh sách 17 bảng và row count;
   - `SHOW CREATE TABLE` hai bảng Paddle;
   - định nghĩa/hash của bốn trigger;
   - row count và trạng thái phân bố của Paddle Specs/sources.
4. Chạy lại Backend test, migration harness và Frontend build trên artifact chuẩn bị phát hành.
5. Chuẩn bị sẵn Backend v1.0 artifact, migration 002 DOWN và câu lệnh kiểm tra phục hồi; không tự động chạy DOWN.

### Trong maintenance window

1. Chặn thao tác ghi Admin Paddle Specs; cart/order có thể tiếp tục nếu deployment platform cho phép tách route an toàn.
2. Xác minh kết nối đúng `luzzshop`, MariaDB 11.5.2 và đúng bốn trigger 001.
3. Chụp lại row count ngay trước DDL.
4. Chạy migration 002 statement-by-statement.
5. Nếu bất kỳ statement nào lỗi: dừng, không tự DROP/rollback; kiểm kê trigger thực tế.
6. Xác minh đúng bốn trigger 002, table DDL và row count không đổi.
7. Deploy Backend v1.1 ngay trong cùng cửa sổ.
8. Khởi động một instance, health/read smoke test, sau đó mới chuyển traffic.
9. Smoke test Admin:
   - list/detail;
   - một hồ sơ được phê duyệt dùng cho UAT;
   - `/confirm` và invalidation theo checklist được cấp phép.
10. Kiểm tra order/cart/inventory read path và một giao dịch test được phê duyệt.
11. Mở lại Admin khi migration, Backend và Frontend đều đúng version.

Không có khoảng thời gian cho phép Backend v1.1 phục vụ với trigger 001 hoặc Backend v1.0 ghi dữ liệu với trigger 002.

## 7. Rollback và xử lý sự cố

### 7.1 Lỗi trước khi chuyển traffic hoặc trước khi có mutation v1.1

1. Giữ maintenance mode.
2. Ghi nhận chính xác trigger nào đang tồn tại; DDL MariaDB implicit commit nên không giả định migration atomic.
3. Nếu migration 002 hoàn tất nhưng Backend không thể triển khai:
   - chỉ sau phê duyệt, chạy migration 002 DOWN để khôi phục bốn trigger 001;
   - xác minh định nghĩa trigger, table DDL và row count;
   - khởi động lại Backend v1.0;
   - chạy smoke test cũ.
4. Nếu migration 002 chạy một phần: không chạy DOWN mù; phục hồi tập trigger theo trạng thái thực tế hoặc restore schema objects từ backup đã xác minh.

### 7.2 Lỗi sau khi đã có mutation bằng Backend v1.1

Ưu tiên **forward fix**. Không tự động quay về v1.0 vì dữ liệu mới có thể hợp lệ theo v1.1 nhưng không đáp ứng giả định v1.0, ví dụ VERIFIED kỹ thuật không có Radar.

Nếu bắt buộc rollback:

1. Đóng toàn bộ mutation Paddle Specs.
2. Export riêng `paddle_specs`, `paddle_spec_sources` và trigger hiện tại.
3. Xác định các row thay đổi kể từ thời điểm deploy bằng timestamps và log triển khai.
4. Audit hồ sơ VERIFIED không có 6/6 Radar và rationale v1.1.
5. Quyết định cách xử lý dữ liệu với phê duyệt nghiệp vụ; không rewrite tự động.
6. Chỉ sau audit mới khôi phục Backend v1.0 + trigger 001 bằng DOWN hoặc restore.
7. Đối chiếu row count, FK/CHECK/UNIQUE, trạng thái và smoke test.

Migration DOWN chỉ thay trigger, không hoàn tác dữ liệu/rubric v1.1. Vì vậy DOWN không phải rollback dữ liệu hoàn chỉnh.

## 8. Kiểm tra sau triển khai

- Database identity/version/collation đúng.
- Đủ 17 bảng; hai Paddle table DDL không đổi.
- Đúng bốn trigger 002, không thiếu hoặc thừa trigger.
- Row count 17 bảng không đổi ngay sau migration.
- Không có row Paddle tự đổi status/completeness do migration.
- Hồ sơ v1.0 vẫn giữ nguyên JSON/status và trả `LEGACY_REVIEW_REQUIRED` khi phù hợp.
- `/confirm` lưu reviewer/time nhưng Save không tự VERIFIED.
- Radar-only mutation giữ technical VERIFIED.
- Technical/source mutation invalidation đúng.
- NULL không bị biến thành 0 hoặc 50.
- Cart/order/inventory smoke test PASS.
- Log không chứa SQL, password, JWT hoặc chi tiết kết nối.

## 9. Frontend 4D.4 bắt buộc

1. Thêm API và nút `Xác nhận thông số` gọi `/confirm`.
2. Giữ submit/review cũ như workflow mở rộng, nhưng không bắt buộc với mô hình một Admin.
3. Chuyển Radar form sang rubric v1.1: chỉ 10/30/50/70/90, band tự khớp, method, confidence, limitations và nguồn đúng trục.
4. Hiển thị riêng technical verified, recommendation eligible, Radar ready và Finder-ready.
5. Hiển thị riêng technical completeness, evidence coverage, Radar coverage/confidence.
6. Cập nhật mô tả Finder-ready theo Specification-first; bỏ yêu cầu Radar và ngưỡng completeness 75% cũ.
7. Tạo mapping Việt hóa tập trung cho field/status/missing code/band/confidence/method/tooltips.
8. `NULL` hiển thị “Chưa có dữ liệu”, không dùng 0 thay thế và không đưa trục thiếu vào Radar chart như điểm 0.
9. Sau mọi mutation phải reload response để phản ánh trigger.
10. Phân biệt thông báo invalidation nguồn technical và nguồn Radar-only.

## 10. File tạo trong Phase 4D.3

- `Database/tests/phase-4d3-deployment-harness.js`
- `docs/paddle-finder/phase-4d3-coordinated-deployment-test-report.md`

Không sửa Frontend, không chạy migration production, không commit hoặc push.
