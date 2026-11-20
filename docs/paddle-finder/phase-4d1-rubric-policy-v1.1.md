# LuzzShop Paddle Finder — Policy và Rubric v1.1

Trạng thái: **đề xuất để phê duyệt, chưa áp dụng production**  
Ngày: 2026-11-19 (Asia/Saigon)

## 1. Mục tiêu và nguyên tắc

Policy v1.1 theo định hướng **Specification-first, Radar-optional** và tách bốn khái niệm độc lập:

1. **`technical_verified`**: các giá trị kỹ thuật đã nhập có bằng chứng hợp lệ hay không.
2. **`recommendation_eligible`**: có đủ technical facts VERIFIED để thuật toán specification-first so sánh có ý nghĩa hay không.
3. **`radar_ready`**: đủ sáu điểm editorial, rationale và confidence theo rubric hay không; đây là lớp bổ sung.
4. **`finder_ready`**: recommendation-eligible, sản phẩm đang bán, có giá hợp lệ và còn tồn kho.

`VERIFIED` chỉ có nghĩa **Đã xác minh kỹ thuật**. Hồ sơ không có điểm Radar vẫn có thể VERIFIED, tham gia Recommendation Engine và trở thành Finder-ready nếu đạt coverage kỹ thuật được phê duyệt. Giá trị chưa biết phải là `NULL`; không dùng 0 hoặc 50 thay cho dữ liệu thiếu. AI không được tạo thông số, chấm điểm, thay đổi điểm hoặc nâng confidence.

## 2. Trạng thái và thuật ngữ

### 2.1 Trạng thái hồ sơ kỹ thuật

Giữ nguyên enum và field API hiện tại để tương thích:

| Giá trị nội bộ | Nhãn Admin | Ý nghĩa v1.1 |
|---|---|---|
| `DRAFT` | Bản nháp | Đang thu thập hoặc chỉnh sửa dữ liệu |
| `IN_REVIEW` | Chờ xác minh | Chờ Admin kiểm tra thông số và bằng chứng |
| `VERIFIED` | Đã xác minh kỹ thuật | Mọi thông số kỹ thuật đã nhập được nguồn VERIFIED hỗ trợ, không có xung đột chưa giải quyết |
| `REJECTED` | Cần chỉnh sửa | Bằng chứng không đạt, dữ liệu sai hoặc xung đột chưa xử lý |

### 2.2 Trạng thái Radar tính động

Không cần enum/cột database mới trong phương án tối thiểu:

| Giá trị API đề xuất | Nhãn Admin | Điều kiện |
|---|---|---|
| `UNSCORED` | Chưa đánh giá Radar | 0/6 trục có điểm hợp lệ |
| `PARTIAL` | Radar chưa đầy đủ | Có từ 1 đến 5 trục hợp lệ, hoặc đủ 6 nhưng có confidence dưới MEDIUM |
| `READY` | Radar sẵn sàng | Đủ 6/6, mỗi trục có rationale, nguồn VERIFIED và confidence từ MEDIUM trở lên |
| `BLOCKED` | Radar có xung đột | Có bằng chứng mâu thuẫn chưa giải quyết hoặc rationale tham chiếu nguồn không còn hợp lệ |

### 2.3 Recommendation-eligible và Finder-ready

`recommendation_eligible` được service tính từ technical facts VERIFIED. Ngưỡng chính thức chỉ được chốt sau dry-run 17 sản phẩm ở mục 13. Điều kiện khung:

- `technical_verified = true`;
- đạt bộ technical feature tối thiểu được phê duyệt;
- technical evidence coverage bằng 100% cho mọi giá trị được dùng;
- không có xung đột nguồn chưa giải quyết.

`finder_ready = true` khi đồng thời:

- `recommendation_eligible = true`;
- sản phẩm đang hoạt động;
- có giá bán hợp lệ;
- tồn kho khả dụng lớn hơn 0;
- không có xung đột bằng chứng chưa giải quyết.

`radar_ready` không phải điều kiện của recommendation-eligible hoặc Finder-ready. Ngân sách cụ thể là bộ lọc request của Finder; việc sản phẩm có một giá bán hợp lệ là điều kiện catalog.

## 3. Phân loại trường kỹ thuật

### 3.1 Bắt buộc để xác minh kỹ thuật

Không bắt buộc một danh sách thông số vật lý cố định. Điều kiện bắt buộc là điều kiện quản trị:

- Sản phẩm tồn tại và thuộc danh mục vợt Pickleball.
- Có ít nhất một nguồn VERIFIED hỗ trợ ít nhất một trường kỹ thuật đã nhập.
- Mọi technical field khác `NULL` đều xuất hiện trong `supported_fields` của ít nhất một nguồn VERIFIED.
- Không có giá trị vi phạm CHECK/validation hoặc xung đột chưa giải quyết.
- Có reviewer, reviewed time và review note khi bị từ chối.

Một hồ sơ quá ít dữ liệu có thể VERIFIED kỹ thuật nhưng có technical completeness thấp. VERIFIED không có nghĩa “đã thu thập đầy đủ”.

### 3.2 Khuyến nghị cho Recommendation Engine

- Trọng lượng tĩnh tối thiểu/tối đa.
- Độ dày lõi và chất liệu lõi.
- Chất liệu mặt và kết cấu chế tạo.
- Chiều dài, chiều rộng và hình dáng vợt.
- Chiều dài cán, chu vi cán nếu được công bố.

### 3.3 Tùy chọn/nâng cao

- Điểm cân bằng đo từ đáy cán.
- Quán tính vung vợt (`swing_weight`).
- Độ ổn định chống xoắn (`twist_weight`).

Ba trường trên được phép `NULL` và không chặn VERIFIED kỹ thuật hoặc trực tiếp chặn Radar nếu có bằng chứng thay thế phù hợp.

## 4. Bằng chứng và confidence

### 4.1 Cấp bằng chứng

| Cấp | Loại bằng chứng | Điều kiện | Confidence tối đa |
|---|---|---|---|
| A | Phép đo/benchmark so sánh được | Có phương pháp, đơn vị, điều kiện đo và nhóm tham chiếu rõ | `HIGH` |
| B | Thông số chính thức + tuyên bố đặc tính rõ ràng | Nguồn nhà sản xuất/tài liệu chứng nhận; ít nhất hai chỉ báo phù hợp hoặc một chỉ báo trực tiếp mạnh | `MEDIUM`; `HIGH` chỉ khi có đo lường cấp A hỗ trợ |
| C | Đánh giá độc lập/nhà phân phối có phương pháp | Mô tả quy trình, mẫu thử và kết quả đủ truy vết | `MEDIUM` |
| D | Suy luận editorial từ technical facts VERIFIED | Ít nhất hai technical facts có quan hệ hợp lý với trục, ghi rõ giới hạn | `LOW` |
| Không đủ | Marketing chung, tên model, một nhận xét không có phương pháp | Không đủ điều kiện chấm | `UNSCORABLE`, score `NULL` |

Nhiều trang sao chép cùng một nội dung chỉ được tính là một nguồn bằng chứng. Bằng chứng xung đột chưa giải quyết làm trục `BLOCKED`, không lấy trung bình để che xung đột.

### 4.2 Mức confidence

| Mức | Tiêu chí bắt buộc | Đủ Finder? |
|---|---|---|
| `HIGH` — Cao | Có bằng chứng A; hoặc nhiều phép đo độc lập, cùng phương pháp/chuẩn so sánh và kết quả nhất quán | Có |
| `MEDIUM` — Trung bình | Có bằng chứng B/C trực tiếp, hoặc ít nhất hai chỉ báo độc lập và nhất quán; rationale nêu giới hạn | Có |
| `LOW` — Thấp | Chủ yếu suy luận D từ technical facts; thiếu phép đo trực tiếp hoặc nguồn độc lập | Không |
| `UNSCORABLE` — Chưa đủ bằng chứng | Không đáp ứng LOW hoặc có xung đột chưa giải quyết | Không; score phải `NULL` |

Admin không được tự chọn confidence cao hơn mức trần của bằng chứng. Service phải kiểm tra cấu trúc; reviewer chịu trách nhiệm xác nhận tính phù hợp nội dung.

## 5. Thủ tục chấm Radar v1.1

### 5.1 Điểm chuẩn và band

Ước tính editorial chỉ dùng năm mốc để tránh độ chính xác giả:

| Band nội bộ | Nhãn | Điểm chuẩn | Ý nghĩa chung |
|---|---|---:|---|
| `VERY_LOW` | Rất thấp | 10 | Đặc tính bị giảm rõ rệt, có bằng chứng trực tiếp |
| `LOW` | Thấp | 30 | Thấp hơn mức cân bằng của nhóm so sánh |
| `BALANCED` | Cân bằng | 50 | Không thiên rõ về hai phía; không dùng làm mặc định khi thiếu dữ liệu |
| `HIGH` | Cao | 70 | Đặc tính được nhấn mạnh rõ ràng |
| `VERY_HIGH` | Rất cao | 90 | Đặc tính nổi trội, cần bằng chứng mạnh và nhất quán |

Chỉ phép đo/benchmark cấp A mới được dùng điểm khác 10/30/50/70/90, và rationale phải ghi công thức chuẩn hóa. MVP Admin nên giới hạn ở năm mốc chuẩn.

### 5.2 Cấu trúc rationale v1.1

```json
{
  "power": {
    "band": "HIGH",
    "reason": "Tóm tắt lập luận dựa trên bằng chứng đã xác minh",
    "sourceIds": [1, 2],
    "method": "EVIDENCE_BASED_ESTIMATE",
    "confidence": "MEDIUM",
    "limitations": "Không có swingweight theo phương pháp chuẩn hóa"
  }
}
```

`sourceIds` phải thuộc cùng hồ sơ và đang VERIFIED. `reason` không được chỉ lặp lại quảng cáo. `limitations` bắt buộc với confidence MEDIUM/LOW, tùy chọn với HIGH.

## 6. Tiêu chí từng trục

### 6.1 Sức mạnh (`power_score`)

Phụ thuộc ưu tiên: benchmark tốc độ bóng/output → swingweight và balance point so sánh được → trọng lượng + kết cấu/lõi → tuyên bố chính thức có đối chứng.

| Band | Tiêu chí v1.1 |
|---|---|
| 10 | Kiểm thử nhất quán cho output rất thấp hoặc thiết kế soft/control-first được nhiều chỉ báo trực tiếp xác nhận |
| 30 | Output dưới nhóm cân bằng; ít nhất hai bằng chứng cho phản hồi mềm/ít trợ lực |
| 50 | Benchmark quanh trung vị hoặc bằng chứng nhất quán cho thiết kế cân bằng |
| 70 | Output trên nhóm cân bằng; cấu trúc/phân bố khối lượng và ít nhất một nguồn trực tiếp cùng hỗ trợ |
| 90 | Dẫn đầu nhóm so sánh bằng benchmark cấp A và có nguồn độc lập/đo lặp xác nhận |

Không suy luận “nặng hơn luôn mạnh hơn”. Thiếu swingweight vẫn có thể đạt MEDIUM nếu có benchmark hoặc nhiều bằng chứng B/C nhất quán.

### 6.2 Kiểm soát (`control_score`)

Phụ thuộc ưu tiên: placement/touch test → phản hồi lõi/kết cấu có tài liệu → mô tả control/touch được xác nhận độc lập.

| Band | Tiêu chí v1.1 |
|---|---|
| 10 | Bằng chứng trực tiếp cho phản hồi rất khó dự đoán/khó kiểm soát |
| 30 | Power-first rõ và touch/placement dưới nhóm cân bằng |
| 50 | Placement/touch quanh trung vị hoặc bằng chứng cân bằng |
| 70 | Kiểm thử hoặc nhiều nguồn nhất quán cho phản hồi mềm, dễ đặt bóng |
| 90 | Placement/touch nổi trội bằng benchmark mạnh và được xác nhận độc lập |

Không dùng `100 - power_score`. Lõi dày không tự động tạo điểm Kiểm soát cao.

### 6.3 Tạo xoáy (`spin_score`)

Phụ thuộc ưu tiên: RPM/benchmark chuẩn hóa → texture/material được xác minh + kiểm thử có phương pháp → tuyên bố chính thức.

| Band | Tiêu chí v1.1 |
|---|---|
| 10 | RPM rất thấp hoặc bề mặt trơn và có kiểm thử xác nhận |
| 30 | Dưới trung vị nhóm so sánh bằng dữ liệu hoặc kiểm thử có phương pháp |
| 50 | Quanh trung vị; không thiên rõ về spin |
| 70 | RPM/kiểm thử trên trung vị, hoặc bề mặt và nguồn độc lập cùng xác nhận spin cao |
| 90 | Nhóm dẫn đầu bằng benchmark lặp lại/so sánh được |

Chỉ có tên vật liệu như “raw carbon” không đủ để chấm một band cụ thể.

### 6.4 Dễ đánh (`forgiveness_score`)

Ý nghĩa: độ ổn định và khả năng giữ phản hồi khi bóng lệch tâm; không phải tuyên bố sức khỏe hay đảm bảo phù hợp mọi người.

Phụ thuộc ưu tiên: twistweight so sánh được → off-center/sweet-spot test → hình dáng, chiều rộng và phân bố khối lượng làm bằng chứng hỗ trợ.

| Band | Tiêu chí v1.1 |
|---|---|
| 10 | Độ ổn định lệch tâm rất thấp qua phép đo/kiểm thử |
| 30 | Sweet spot nhỏ hoặc phản hồi lệch tâm dưới nhóm cân bằng |
| 50 | Độ ổn định quanh trung vị; không có ưu/nhược điểm rõ |
| 70 | Twistweight/off-center test cao hoặc nhiều chỉ báo nhất quán cho sweet spot rộng |
| 90 | Dẫn đầu về ổn định lệch tâm bằng phép đo mạnh và kiểm thử lặp lại |

Chỉ chiều rộng hoặc shape không đủ cho MEDIUM confidence; phải có ít nhất một bằng chứng trực tiếp hoặc chỉ báo độc lập bổ sung.

### 6.5 Linh hoạt (`maneuverability_score`)

Phụ thuộc ưu tiên: swingweight → balance point + trọng lượng + chiều dài → kiểm thử handling có phương pháp.

| Band | Tiêu chí v1.1 |
|---|---|
| 10 | Rất chậm/khó xoay trở qua swingweight hoặc kiểm thử trực tiếp |
| 30 | Chậm hơn nhóm cân bằng; nhiều chỉ báo phân bố khối lượng cùng hướng |
| 50 | Handling quanh trung vị |
| 70 | Nhanh, dễ đổi hướng; swingweight/handling test hoặc nhiều chỉ báo nhất quán |
| 90 | Nhóm nhanh nhất bằng đo lường/benchmark mạnh |

Không dùng nghịch đảo của Sức mạnh. Trọng lượng tĩnh thấp không tự động đồng nghĩa Linh hoạt cao.

### 6.6 Thoải mái (`comfort_score`)

Ý nghĩa: cảm nhận rung, độ êm khi tiếp xúc và mức dễ chịu khi thao tác. Không được diễn giải thành phòng tránh hoặc điều trị chấn thương.

Phụ thuộc ưu tiên: đo rung/damping → kết cấu giảm rung có bằng chứng → nhiều đánh giá có phương pháp và nhất quán.

| Band | Tiêu chí v1.1 |
|---|---|
| 10 | Rung/độ gắt rất cao và được phép đo hoặc nhiều nguồn nhất quán xác nhận |
| 30 | Cảm giác cứng/gắt hơn nhóm cân bằng |
| 50 | Cảm giác trung tính, quanh trung vị |
| 70 | Damping tốt hoặc nhiều đánh giá có phương pháp cho cảm giác êm |
| 90 | Damping nổi trội bằng đo lường và nhiều nguồn độc lập nhất quán |

Một nhận xét chủ quan đơn lẻ không đủ để chấm. Không dùng ngôn ngữ y tế hoặc cam kết an toàn chấn thương.

## 7. Phụ thuộc field — nguồn — Radar

| Trục | Technical field hỗ trợ | Bằng chứng trực tiếp ưu tiên | Khi field nâng cao thiếu |
|---|---|---|---|
| Sức mạnh | trọng lượng, balance point, swingweight, lõi, kết cấu | output/ball-speed test | Cho phép chấm nếu có benchmark hoặc nhiều bằng chứng B/C |
| Kiểm soát | độ dày lõi, vật liệu lõi, kết cấu | touch/placement test | Không suy luận chỉ từ độ dày lõi |
| Tạo xoáy | vật liệu mặt, kết cấu/bề mặt | RPM/spin test | Tuyên bố vật liệu đơn lẻ chỉ đạt LOW hoặc UNSCORABLE |
| Dễ đánh | twistweight, chiều rộng, shape, balance point | off-center/sweet-spot test | Shape/width cần thêm bằng chứng độc lập để đạt MEDIUM |
| Linh hoạt | swingweight, balance point, trọng lượng, chiều dài | handling test | Có thể MEDIUM từ nhiều field + nguồn C; không dùng trọng lượng đơn lẻ |
| Thoải mái | kết cấu, lõi, trọng lượng/balance hỗ trợ | vibration/damping test | Nhận xét chủ quan đơn lẻ không đủ |

Technical facts chỉ được dùng khi chính field đó được nguồn VERIFIED hỗ trợ. Một source có thể hỗ trợ technical field, score, hoặc cả hai. Rationale phải tham chiếu nguồn score/evidence phù hợp; không được tham chiếu một nguồn chỉ hỗ trợ field không liên quan.

## 8. Cách tính chất lượng v1.1

### 8.1 Technical completeness

Đo mức thu thập dữ liệu, không đo độ đúng. Trọng số đề xuất:

- Identity: 5.
- Trọng lượng: 15.
- Lõi: 15.
- Mặt/kết cấu: 15.
- Kích thước/shape: 35, tính tỷ lệ trên 5 trường.
- Advanced metrics: 10, chia đều ba trường.
- Review metadata: 5.

Tổng 100. Thiếu toàn bộ advanced metrics chỉ mất 10 điểm và không chặn VERIFIED.

### 8.2 Technical evidence coverage

```text
100 × (tổng trọng số technical field đã nhập và được nguồn VERIFIED hỗ trợ)
    / (tổng trọng số technical field đã nhập)
```

Không có technical field nào được nhập thì coverage bằng 0 và chưa đủ VERIFIED. VERIFIED kỹ thuật yêu cầu coverage 100%, dù completeness có thể thấp.

### 8.3 Radar coverage

`100 × số trục có score + rationale cấu trúc hợp lệ + ít nhất một source VERIFIED / 6`.

### 8.4 Radar confidence

- `UNSCORABLE` nếu 0 trục hợp lệ hoặc có xung đột chặn.
- `LOW` nếu confidence thấp nhất trong các trục đã chấm là LOW.
- `MEDIUM` nếu đủ 6 trục và tất cả từ MEDIUM trở lên, nhưng có ít nhất một MEDIUM.
- `HIGH` nếu đủ 6 trục và tất cả HIGH.

`radar_ready` yêu cầu radar coverage 100% và radar confidence tối thiểu MEDIUM. Điều kiện này chỉ quyết định khả năng hiển thị Radar đầy đủ, không quyết định Recommendation/Finder eligibility.

### 8.5 Recommendation eligibility và scoring

Eligibility chính thức chưa được khóa trước dry-run 17 sản phẩm. Bộ điều kiện ứng viên để kiểm thử là:

- technical VERIFIED;
- có trọng lượng tĩnh;
- có độ dày lõi;
- có ít nhất hai trong các trường chiều dài, chiều rộng, chiều dài cán, chu vi cán, shape;
- có ít nhất một trong face material, core material, construction;
- mọi giá trị dùng cho scoring có nguồn VERIFIED hỗ trợ.

Swingweight, twistweight và balance point không thuộc bộ tối thiểu. Nếu dry-run cho thấy nhóm sản phẩm cũ không đạt bộ ứng viên trên dù có thể thu thập đủ dữ liệu hữu ích, ngưỡng phải được điều chỉnh bằng policy được phê duyệt, không hạ ngầm trong code.

Recommendation Engine thực hiện:

1. Lọc theo active, tồn kho, ngân sách và recommendation eligibility.
2. Chuẩn hóa chỉ các technical facts VERIFIED trong catalog, theo version thuật toán.
3. Ánh xạ nhu cầu người chơi sang feature có bằng chứng; không dùng Radar làm input bắt buộc.
4. Tính điểm trên các feature khả dụng và chuẩn hóa lại tổng trọng số; áp dụng coverage penalty để hồ sơ ít dữ liệu không vượt hồ sơ đầy đủ một cách giả tạo.
5. Trả lý do từ technical facts và nguồn; Radar chỉ được thêm vào phần giải thích khi radar-ready hoặc trục tương ứng hợp lệ.

Ánh xạ ban đầu để dry-run, chưa phải công thức production:

| Nhu cầu | Technical facts có thể dùng | Giới hạn |
|---|---|---|
| Sức mạnh | trọng lượng, lõi, construction; balance/swingweight nếu có | Không suy luận “nặng hơn luôn mạnh hơn”; cần benchmark catalog và rationale thuật toán |
| Kiểm soát | độ dày/vật liệu lõi, construction, kích thước/shape | Không coi 16 mm tự động là kiểm soát cao |
| Cân bằng | khoảng cách chuẩn hóa giữa các proxy đã đủ coverage | Không dùng điểm Radar thiếu |
| Nền tảng Tennis | chiều dài, shape elongated, chiều dài cán, trọng lượng | Chỉ là preference fit, không khẳng định hiệu năng tuyệt đối |
| Nền tảng Cầu lông | trọng lượng và handling metrics nếu có | Thiếu swingweight/balance phải hạ confidence, không tự suy đoán |
| Nền tảng Bóng bàn | chiều rộng/shape, cán và trọng lượng | Không áp đặt một shape duy nhất cho mọi người |
| Ưu tiên thoải mái | core material/thickness, construction và bằng chứng damping | Không có claim sức khỏe; thiếu bằng chứng thì không chấm proxy này |

Mỗi kết quả cần trả `score_coverage`, `evidence_confidence` và danh sách feature đã thực sự dùng. Không tính một tiêu chí người dùng nếu sản phẩm không có bằng chứng cho tiêu chí đó; thay vào đó hiển thị giới hạn so sánh.

## 9. Invalidation và tính lại

### 9.1 Khi technical fact thay đổi

- Nếu hồ sơ VERIFIED: chuyển `IN_REVIEW`, xóa reviewer/time của xác minh kỹ thuật.
- Tính lại technical completeness và evidence coverage.
- Tính lại mọi trục Radar phụ thuộc field vừa đổi.
- Trục bị ảnh hưởng chuyển không hợp lệ cho đến khi rationale được reviewer xác nhận lại.

### 9.2 Khi score/rationale/rubric thay đổi

- Không làm mất VERIFIED kỹ thuật.
- Tính lại radar coverage, confidence và radar status.
- Không thay đổi recommendation eligibility hoặc finder-ready vì Radar là tùy chọn.
- Score có source bị mất hiệu lực phải trở về không hợp lệ; không tự giữ READY.

### 9.3 Khi nguồn thay đổi

- Nếu nguồn hỗ trợ technical field: technical VERIFIED phải về `IN_REVIEW` khi thêm/sửa/xóa hoặc đổi trạng thái nguồn.
- Nếu nguồn chỉ hỗ trợ score: không đổi technical status, nhưng tính lại Radar.
- Nếu nguồn hỗ trợ cả hai: áp dụng cả hai nhánh.
- Khi source từ VERIFIED sang PENDING/REJECTED, mọi field/axis chỉ dựa vào nguồn đó mất coverage ngay.
- Sau thay đổi nguồn technical, tính lại recommendation eligibility và finder-ready; sau thay đổi nguồn Radar-only, hai giá trị này giữ nguyên.

Các phép tính phải chạy trong cùng transaction service và response phải đọc lại trạng thái thực tế sau trigger.

## 10. Tương thích rubric v1.0

- Không sửa hoặc tự nâng cấp JSON v1.0 trong migration trigger.
- API tiếp tục đọc `v1.0` và `v1.1`.
- Hồ sơ v1.0 đang VERIFIED giữ nguyên trạng thái khi chạy migration.
- Recommendation eligibility của hồ sơ v1.0 chỉ dựa vào technical facts VERIFIED, không phụ thuộc score legacy.
- Vì v1.0 không có confidence, Radar legacy dùng trạng thái chuyển tiếp `LEGACY_REVIEW_REQUIRED`; không tự coi là MEDIUM.
- Khi Admin sửa score/rationale, toàn bộ scoring set phải được lưu theo v1.1 và bổ sung confidence/method/limitations.

## 11. Việt hóa tập trung

Frontend cần một module ánh xạ duy nhất cho field, trục, trạng thái, source type, band, confidence, missing code, breakdown và tooltip. Tên database/API/enum giữ nguyên.

Các nhãn trục bắt buộc: Sức mạnh, Kiểm soát, Tạo xoáy, Dễ đánh, Linh hoạt, Thoải mái. `NULL`/`undefined`/chuỗi rỗng hiển thị **Chưa có dữ liệu**; số 0 phải hiển thị đúng là 0. Radar không được chuyển `NULL` thành 0.

Backend nên trả stable error/missing codes và message tiếng Việt; Frontend dùng ánh xạ để không hiển thị trực tiếp `static_weight_min_g`, `score_rationale.power` hoặc enum nội bộ.

## 12. Phạm vi không thuộc policy

- Không chẩn đoán, điều trị hoặc cam kết phòng tránh chấn thương.
- Không cho AI chấm điểm hay tạo dữ liệu.
- Không tự suy luận từ tên sản phẩm.
- Không thay đổi cart, checkout, order, payment hoặc inventory.

## 13. Khảo sát khả năng thu thập cho 17 sản phẩm

Khảo sát ngày 2026-11-19 dùng danh mục read-only của `luzzshop` và nguồn web chính thức. Đây là khảo sát availability, không phải nhập hoặc xác nhận giá trị vào database.

### 13.1 Danh mục

- 10 JOOLA: Agassi Pro V, Graf Pro V, Hyperion Pro IV, hai Kosmos Pro V, Perseus Pro IV, hai Perseus Pro V, Scorpeus Pro V và Magnus Pro IV.
- 7 Sypik: Avatar Ultimate Pro, hai Triton 5, ba biến thể Triton Pro 16 mm và Triton Pro 3 Ultimate.

### 13.2 Kết quả sơ bộ theo nhóm

| Nhóm catalog | Số sản phẩm | Nguồn chính thức tìm được | Khả năng technical facts cơ bản | Advanced metrics | Kết luận |
|---|---:|---|---|---|---|
| JOOLA Pro V | 7 | Trang/collection JOOLA chính thức có model/variant | Tốt: thường có core thickness, trọng lượng, mặt, kích thước và cán | Không thấy swingweight, twistweight, balance point trong bảng chính thức đã khảo sát | Có triển vọng đạt eligibility specification-first |
| JOOLA Pro IV | 3 | Collection và trang sản phẩm JOOLA chính thức | Tốt cho kích thước, trọng lượng, mặt/cán; construction claim theo dòng | Advanced metrics không được công bố dạng số | Có triển vọng; cần đối chiếu đúng variant 14/16 mm |
| Sypik Triton 5 Pro Ultimate | 1 | Trang Sypik chính thức hiện hành | Có thickness, core/face/construction claims; physical specs trên trang crawl chưa đầy đủ | Không thấy advanced metrics | Cần thu thập bổ sung từ tài liệu/nhãn sản phẩm chính thức |
| Sypik Avatar Ultimate Pro | 1 | Trang Sypik chính thức hiện hành cho bản “Ultimate Pro Tour” | Có thickness/weight option và construction claims | Không thấy advanced metrics; kích thước chi tiết chưa rõ trên trang crawl | Phải xác nhận model catalog có đúng “Pro Tour” hay không trước khi dùng nguồn |
| Sypik Triton 5 Limited/Golden Horse | 1 | Chưa tìm thấy đúng edition trên site chính thức hiện hành | Chưa xác định đầy đủ | Không thấy | Không chốt eligibility trước khi xác minh identity/variant |
| Sypik Triton Pro 16 mm và sign variants | 3 | Chưa tìm thấy đúng model cũ trên site chính thức hiện hành | Nguồn retailer có dữ liệu nhưng cần phân loại/kiểm chứng | Không thấy | Có rủi ro coverage; cần distributor/bao bì/tài liệu chính thức |
| Sypik Triton Pro 3 Ultimate | 1 | Chưa tìm thấy đúng model trên site Sypik hiện hành | Retailer/authorized listing có bộ thông số cơ bản, nhưng chưa đủ để coi là manufacturer source | Không thấy | Cần xác minh nguồn và phương pháp trước eligibility |

Nguồn khảo sát chính:

- JOOLA paddle catalog: https://joola.com/pages/pickleball-paddles
- JOOLA Pro V: https://joola.com/collections/pro-v
- JOOLA Pro IV: https://joola.com/collections/pro-iv
- Sypik chính thức: https://sypik.com/
- Sypik Triton 5 official page: https://sypik.com/product/vot-sypik-triton-5-pro-ultimate-bac
- Sypik Avatar official page: https://sypik.com/product/vot-sypik-avatar-ultimate-pro-tour-xanh-duong

### 13.3 Quy trình dry-run trước khi khóa eligibility

1. Lập sheet 17 dòng × 14 technical fields, chỉ đánh dấu `FOUND_VERIFIED`, `FOUND_PENDING`, `CONFLICT`, `NOT_FOUND`; không nhập số vào production.
2. Xác minh model/variant chính xác, đặc biệt edition và signature color.
3. Ưu tiên manufacturer; sau đó authorized distributor/certified document; retailer khác chỉ là lead cho nghiên cứu.
4. Tính tỷ lệ coverage theo sản phẩm và theo brand.
5. Chạy thử ít nhất ba bộ điều kiện eligibility, đo số sản phẩm còn lại và độ phủ từng tiêu chí người dùng.
6. Chọn điều kiện không thiên lệch vô lý về một brand nhưng vẫn đủ feature để giải thích recommendation.
7. Ghi policy version và phê duyệt trước khi code Recommendation Engine.

Chưa có đủ bằng chứng để khóa ngưỡng eligibility production ở Phase 4D.1. Bộ ứng viên tại mục 8.5 chỉ dùng cho dry-run.
