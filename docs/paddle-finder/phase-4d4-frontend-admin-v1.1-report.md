# LuzzShop Paddle Finder — Phase 4D.4 Frontend Admin v1.1

Ngày hoàn thành: 2026-11-20 (Asia/Saigon)  
Phạm vi: Frontend Admin Paddle Specs và test Frontend  
Production `luzzshop`: **không chạy migration, không ghi dữ liệu**

## 1. Kết quả

Frontend Admin Paddle Specs đã chuyển sang policy Specification-first, Radar-optional và contract Backend v1.1:

- Thêm hành động chính `Xác nhận thông số` gọi `POST /api/admin/paddle-specs/:productId/confirm`.
- Không bắt buộc Admin gửi duyệt rồi tự phê duyệt; workflow cũ được giữ trong phần mở rộng.
- Sau mọi mutation, giao diện gọi lại detail API và hiển thị trạng thái database thực tế.
- Tách xác minh kỹ thuật, độ đầy đủ kỹ thuật, độ phủ bằng chứng, điều kiện tư vấn, Finder và Radar.
- Bỏ mô tả Radar 6/6 và completeness 75% là điều kiện xác nhận/Finder.
- Radar chuyển sang rubric v1.1 và giữ dữ liệu thiếu là `NULL`.
- Tên field API/database và enum nội bộ giữ nguyên.

## 2. File tạo mới

- `Frontend/src/config/paddleSpecs.js`
- `Frontend/test/paddleSpecs.test.js`
- `docs/paddle-finder/phase-4d4-frontend-admin-v1.1-report.md`

## 3. File chỉnh sửa

- `Frontend/src/api/paddleSpecApi.js`
- `Frontend/src/components/paddleRadarChart/index.jsx`
- `Frontend/src/components/paddleRadarChart/style.scss`
- `Frontend/src/pages/adminPaddleSpecDetailPage/index.jsx`
- `Frontend/src/pages/adminPaddleSpecDetailPage/style.scss`
- `Frontend/src/pages/adminPaddleSpecsPage/index.jsx`
- `Frontend/src/pages/adminPaddleSpecsPage/style.scss`
- `Frontend/package.json`
- `Frontend/eslint.config.js`

Không sửa Backend, database schema, product/order/cart/inventory/payment hoặc route ngoài Admin Paddle Specs.

## 4. Quy trình xác nhận trực tiếp

Tab `Xác minh & tư vấn` hiển thị:

- trạng thái xác minh kỹ thuật;
- technical completeness;
- technical evidence coverage;
- recommendation eligibility;
- Finder-ready;
- Radar status/coverage/confidence.

Nút `Xác nhận thông số` chỉ bật khi API trả `quality.technical_evidence.can_confirm = true`. Ghi chú là tùy chọn. Nhấn Lưu thông số không tự xác nhận.

Sau `/confirm`, giao diện không dùng response cục bộ để giả định trạng thái mà gọi lại `GET /:productId`. Cùng cơ chế reload được dùng sau sửa technical facts, Radar và nguồn.

Workflow submit/review cũ vẫn nằm trong `Quy trình kiểm duyệt mở rộng`, phục vụ khả năng mở rộng nhiều người duyệt nhưng không còn là luồng chính.

## 5. Radar v1.1

Mỗi trục chỉ nhận một trong năm mốc:

- 10 — Rất thấp;
- 30 — Thấp;
- 50 — Cân bằng;
- 70 — Cao;
- 90 — Rất cao.

Với trục có điểm, form yêu cầu:

- rationale;
- ít nhất một nguồn VERIFIED hỗ trợ đúng `<axis>_score`;
- method;
- confidence;
- limitations khi confidence LOW hoặc MEDIUM.

Payload luôn dùng `rubric_version: v1.1`. Trục trống gửi `null` và không có rationale entry. Hồ sơ legacy v1.0 được cảnh báo và phải chuyển toàn bộ trục có điểm sang cấu trúc v1.1 trước khi lưu.

Radar chart:

- không chuyển `NULL` thành 0;
- chỉ vẽ polygon khi đủ 6/6 trục;
- với dữ liệu partial, chỉ vẽ điểm của trục đã có;
- hiển thị số trục có dữ liệu và thông báo dữ liệu thiếu.

## 6. Việt hóa tập trung

`Frontend/src/config/paddleSpecs.js` là nguồn ánh xạ chung cho:

- technical fields và đơn vị;
- nhóm trường;
- sáu trục Radar;
- shape;
- verification/source/Radar status;
- source type;
- band, confidence và method;
- breakdown/missing/error code;
- tooltip thuật ngữ;
- thông báo `Chưa có dữ liệu`.

Các thuật ngữ chuyên sâu có tooltip riêng:

- điểm cân bằng;
- quán tính vung vợt;
- độ ổn định chống xoắn;
- Dễ đánh/Forgiveness;
- Thoải mái và giới hạn không phải tư vấn sức khỏe.

Danh sách `supported_fields`, missing codes và lỗi API không hiển thị trực tiếp tên cột khi có mapping. Fallback dùng thông báo tiếng Việt chung thay vì raw key.

## 7. Phân nhóm giao diện

Thông số kỹ thuật được chia thành:

1. Thông số cơ bản.
2. Cấu tạo và vật liệu.
3. Thông số nâng cao (tùy chọn).

Danh sách Admin hiển thị riêng:

- trạng thái kỹ thuật;
- độ đầy đủ;
- độ phủ bằng chứng;
- điều kiện tư vấn;
- trạng thái Radar;
- Finder-ready.

Nguồn được gắn nhãn `Nguồn kỹ thuật` hoặc `Nguồn Radar`, kèm giải thích tác động invalidation tương ứng migration 002.

## 8. Responsive và thiết kế

Giao diện giữ palette, border, button, radius và typography của Admin LuzzShop. Thay đổi tập trung vào thứ bậc thông tin:

- desktop: quality grid ba cột, technical form ba cột;
- tablet: quality/form hai cột, Radar preview chuyển lên trên;
- mobile: một cột, actions và score fields xếp dọc;
- table danh sách dùng horizontal overflow để không làm vỡ dữ liệu;
- bổ sung focus-visible và reduced-motion cho phần tương tác mới.

## 9. Kiểm thử

Kết quả cuối:

- `npm run lint`: **PASS**, 0 lỗi.
- `npm run test:paddle`: **3/3 PASS**.
- `npm run build`: **PASS**, 158 modules transformed.
- Backend regression `npm test`: **15/15 PASS**.
- Order/inventory regression trong suite Backend: **6/6 PASS**.

Frontend test xác minh:

- payload luôn là rubric v1.1;
- các trục thiếu giữ `null`, không thành 0/50;
- band khớp mốc 10/30/50/70/90;
- score tùy ý và thiếu evidence bị validation;
- nhãn field/missing/error code được Việt hóa.

Contract `/confirm`, Radar v1.1 và invalidation đã được Backend kiểm thử trên clone production ở Phase 4D.3, 44/44 PASS. Phase 4D.4 không tạo clone mới và không kết nối Frontend vào production để tránh mutation ngoài phạm vi.

## 10. Vấn đề còn lại

- Vite cảnh báo bundle JavaScript khoảng 502 kB sau minify. Build vẫn PASS; có thể xử lý bằng route-level code splitting trong một phase tối ưu riêng.
- Repository chưa có browser E2E framework nên chưa tự động hóa click-through/visual regression. Logic payload được unit test và API contract được rehearsal ở Phase 4D.3.
- Recommendation policy Backend vẫn `PROVISIONAL` cho đến khi dry-run đủ 17 sản phẩm được phê duyệt; UI hiển thị rõ `Chính sách đang thử nghiệm`.
- Frontend 4D.4 không được phát hành riêng khi production vẫn dùng Backend/trigger v1.0. Migration 002, Backend v1.1 và Frontend 4D.4 cần triển khai phối hợp theo checklist Phase 4D.3.

Không commit hoặc push.
