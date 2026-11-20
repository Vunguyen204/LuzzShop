# Phase 4D.5 — Full-stack UAT & Production Readiness

Ngày kiểm thử: 20/11/2026  
MariaDB: 11.5.2  
Production: `luzzshop` (chỉ đọc, không chạy migration, không ghi dữ liệu)  
Clone UAT: `luzzshop_4d5_uat_12076_1795114154948` (đã xóa sau kiểm thử)

## 1. Phạm vi và môi trường

- Clone độc lập được tạo từ đủ 17 bảng của `luzzshop`, sau đó áp dụng migration 002.
- Clone có đúng 4 trigger v1.1. Hai tài khoản và dữ liệu UAT chỉ được tạo trong clone.
- Backend v1.1 chạy tại cổng 5001 với `DB_NAME` trỏ tới clone.
- Frontend 4D.4 chạy tại cổng 5175 với API Paddle/Auth trỏ tới Backend clone.
- UAT trình duyệt thực hiện bằng Chrome thật ở desktop và viewport mobile 390x844.
- Sau UAT, Backend/Frontend đã dừng và clone đã được xác nhận xóa (`removed: true`).
- Row count production trước và sau UAT khớp tuyệt đối ở cả 17 bảng.

## 2. Kết quả UAT trình duyệt

| Ca kiểm thử | Kết quả | Bằng chứng quan sát |
|---|---:|---|
| Đăng nhập Admin và mở Paddle Specs | PASS | Điều hướng thẳng tới `/admin/paddle-specs`; danh sách đủ 17 vợt |
| Tạo hồ sơ DRAFT | PASS | Tạo hồ sơ cho sản phẩm clone ID 8 |
| Nhập thông số cơ bản, để trống thông số nâng cao/Radar | PASS | `swing_weight`, `twist_weight`, `balance_point` và 6 trục Radar giữ NULL |
| Không có nguồn | PASS | Nút xác nhận bị khóa; hiển thị từng trường thiếu nguồn bằng tiếng Việt |
| Thêm nguồn chính thức đang PENDING | PASS | Độ phủ bằng chứng vẫn 0%; cảnh báo nguồn chờ xác minh |
| Xác minh nguồn | PASS | Nguồn chuyển “Đã xác minh”; độ phủ bằng chứng đạt 100% |
| Xác nhận trực tiếp `/confirm` | PASS | Hồ sơ VERIFIED không cần Radar |
| Eligibility/Finder | PASS | `recommendation_eligible = true`, `finder_ready = true` khi sản phẩm còn hàng/đang bán/có giá |
| Radar NULL | PASS | Hiển thị “Chưa có dữ liệu”, 0/6; UI nêu rõ NULL không được quy đổi thành 0 |
| Sửa technical fact | PASS | Trạng thái chuyển về IN_REVIEW, mất technical verification/Finder-ready |
| Xác nhận lại sau đối chiếu | PASS | Nguồn còn hợp lệ, xác nhận lại thành công |
| Từ chối nguồn kỹ thuật | PASS | Nguồn REJECTED và hồ sơ bị invalidation về IN_REVIEW |
| Không có quyền Admin | PASS | User thường đăng nhập thành công nhưng Admin API trả 403 và thông báo tiếng Việt |
| Backend mất kết nối | PASS | Trang hiển thị “Không thể tải hồ sơ thông số vợt.”, không lộ lỗi SQL/nội bộ |
| Responsive mobile | PASS | Sidebar chuyển sang menu đóng/mở; form, tab và nhãn vẫn truy cập được ở 390x844 |
| Việt hóa | PASS | Field, đơn vị, trạng thái, loại nguồn, supported fields, validation và tooltip đều dùng nhãn tập trung tiếng Việt |

Các ca dữ liệu ngoài giới hạn, nguồn chưa xác minh, nguồn không hỗ trợ field, UNIQUE/FK và lỗi DB còn được kiểm chứng ở integration tests Backend. Không có thông số hay điểm Radar giả được ghi vào production.

## 3. Automated regression

| Bộ kiểm thử | Kết quả |
|---|---:|
| Frontend ESLint | PASS |
| Frontend Paddle Specs | 3/3 PASS |
| Vite production build | PASS |
| Backend toàn bộ | 15/15 PASS |
| Order/inventory regression | 6/6 PASS |
| Paddle Backend v1.1 | 9/9 PASS |
| Migration 002 rehearsal | 21/21 PASS |

Order tests bao phủ tạo đơn COD, giá từ DB, JWT ownership, validation variant/stock, chống oversell, hủy đơn và hoàn tồn kho đúng một lần, phân quyền Admin và terminal states. Payment online chưa có test suite riêng; build chỉ xác nhận cart/checkout/payment frontend không bị lỗi biên dịch.

Vite build có cảnh báo bundle JS 502.45 kB (>500 kB), không chặn phát hành nhưng nên code-split sau MVP.

## 4. Tương thích và rollback

Migration 002 giữ nguyên định nghĩa hai bảng và dữ liệu v1.0, chỉ thay bốn trigger invalidation. Backend v1.1 + migration 002 + Frontend 4D.4 hoạt động đồng bộ theo specification-first, Radar-optional.

- Trước khi có dữ liệu/hành vi v1.1: DOWN đã được rehearsal, khôi phục đúng 4 trigger legacy và không đổi row count/schema.
- Sau khi có dữ liệu v1.1: không tự động chạy DOWN. Trigger 001 sẽ làm thay đổi Radar hoặc mọi nguồn hủy VERIFIED kỹ thuật, trái policy v1.1; rollback có thể làm sai trạng thái nghiệp vụ dù không làm mất cột.
- Phương án ưu tiên sau go-live là forward-fix. Nếu buộc rollback Backend/Frontend, giữ migration 002 hoặc đặt maintenance/read-only cho Paddle Specs, đánh giá từng hồ sơ phát sinh rồi mới quyết định DOWN.

## 5. Vấn đề phát hiện

### Đã sửa trong UAT

1. **Cao — Sai backend khi UAT đa môi trường.** API Auth và Paddle trước đây cố định cổng 5000. Đã hỗ trợ `VITE_API_BASE_URL`, vẫn fallback cổng 5000 để tương thích hiện tại.
2. **Cao — Admin login điều hướng qua storefront.** Login trước đây đưa Admin về `/`, các request legacy có thể nhận 401 và interceptor xóa token trước khi vào Admin. Đã điều hướng Admin trực tiếp tới `/admin/paddle-specs`; customer vẫn về `/`.

### Còn tồn tại

1. **Trung bình — API frontend chưa có base URL tập trung toàn ứng dụng.** Auth/Paddle đã cấu hình được, nhưng một số API legacy vẫn hard-code cổng 5000. Production hiện dùng mặc định nên không chặn đợt triển khai này; cần chuẩn hóa ở giai đoạn sau.
2. **Trung bình — Chưa có E2E suite tự động.** Luồng Admin đã chạy trên Chrome thật trong lượt UAT này nhưng chưa có Playwright/Cypress để lặp lại CI.
3. **Trung bình — Payment online chưa có regression tự động riêng.** Không có code payment bị sửa, nhưng chỉ có build và order/COD regression; cần smoke test cổng thanh toán nếu production sử dụng thanh toán online.
4. **Thấp — Bundle vượt 500 kB.** Vite cảnh báo code splitting.
5. **Thấp — Các request legacy ở storefront có unhandled 401 khi dùng cấu hình UAT cổng khác.** Không ảnh hưởng route Admin sau sửa redirect; cùng nguyên nhân với base URL chưa tập trung.

## 6. Checklist triển khai đồng bộ

### Trước maintenance window

- [ ] Chốt commit/release artifact của migration 002, Backend v1.1 và Frontend 4D.4 cùng một release.
- [ ] Tạo full backup production gồm schema, data, trigger và object liên quan.
- [ ] Restore backup vào clone mới; so sánh 17 bảng, schema, trigger và row count.
- [ ] Ghi hash/kích thước/thời gian của backup và hai migration UP/DOWN.
- [ ] Xác nhận biến môi trường production và secret; không đưa mật khẩu vào lệnh/log.
- [ ] Chuẩn bị health check, smoke script, người quyết định go/no-go và maintenance notice.

### Trong maintenance window

- [ ] Dừng ghi Paddle Specs/Admin liên quan; giữ cart/order/inventory hoạt động nếu kiến trúc cho phép tách biệt.
- [ ] Xác nhận đang kết nối đúng `luzzshop`, MariaDB 11.5.2, hiện có 17 bảng và 4 trigger 001.
- [ ] Áp dụng migration 002 một lần; dừng ngay nếu câu lệnh nào thất bại, không tự DROP/rollback phá hủy.
- [ ] Xác nhận 4 trigger 002 đúng tên/body; bảng và row count không đổi.
- [ ] Khởi động Backend v1.1, kiểm tra health/log và một GET Admin read-only.
- [ ] Phát hành Frontend 4D.4 với API origin đúng production.

### Smoke test sau phát hành

- [ ] Admin login đi thẳng vào Admin Paddle Specs.
- [ ] Danh sách 17 vợt, trạng thái cũ và hồ sơ rubric v1.0 hiển thị đúng.
- [ ] Mở hồ sơ đã có bằng thao tác chỉ đọc; xác nhận nhãn tiếng Việt và NULL.
- [ ] Trên một hồ sơ được phê duyệt cho smoke test: lưu technical fact phải invalidation; Radar-only không invalidation technical VERIFIED.
- [ ] `/confirm` chỉ thành công khi tất cả technical facts có verified source hỗ trợ.
- [ ] Finder-ready độc lập Radar và vẫn phụ thuộc giá, trạng thái, tồn kho.
- [ ] Smoke cart, checkout, tạo/hủy order, inventory và payment method đang dùng.
- [ ] So sánh 17 bảng/row count, kiểm tra log 4xx/5xx và trigger sau triển khai.

## 7. Kết luận readiness

**Sẵn sàng có điều kiện (GO sau phê duyệt).** Bộ ba migration 002, Backend v1.1 và Frontend 4D.4 đã tương thích trên clone và đạt UAT chính. Production chỉ nên triển khai đồng bộ trong maintenance window sau khi backup mới được restore-verify. Không triển khai Backend v1.1 riêng khi production còn trigger 001. Payment online cần smoke test theo phương thức production trước khi đóng maintenance window.

