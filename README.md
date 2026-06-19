# LuzzShop

LuzzShop là website thương mại điện tử bán sản phẩm Pickleball, được xây dựng bằng **ReactJS**, **NodeJS/Express** và **MySQL**. Dự án hỗ trợ giao diện người dùng để xem sản phẩm, lọc sản phẩm, giỏ hàng, thanh toán, đăng nhập/đăng ký và khu vực quản trị dành cho Admin.

## Công nghệ sử dụng

### Frontend

- ReactJS
- React Router DOM
- Axios
- SCSS
- Vite

### Backend

- NodeJS
- ExpressJS
- MySQL
- JWT
- Bcrypt
- Multer
- CORS
- Dotenv

## Chức năng chính

### Người dùng

- Xem danh sách sản phẩm
- Xem chi tiết sản phẩm
- Lọc sản phẩm theo danh mục, thương hiệu, giá và giảm giá
- Xem sản phẩm khuyến mãi
- Thêm sản phẩm vào giỏ hàng
- Cập nhật số lượng sản phẩm trong giỏ hàng
- Xóa sản phẩm khỏi giỏ hàng
- Đăng ký tài khoản
- Đăng nhập tài khoản
- Xem thông tin cá nhân
- Thanh toán đơn hàng
- Thêm sản phẩm vào danh sách yêu thích

### Quản trị viên

- Xem dashboard tổng quan
- Quản lý menu
- Quản lý danh mục sản phẩm
- Quản lý thương hiệu
- Quản lý sản phẩm
- Quản lý đơn hàng
- Quản lý người dùng

## Cấu trúc thư mục

```bash
LuzzShop/
│
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── package.json
└── README.md
```

## Cài đặt dự án

### 1. Clone repository

```bash
git clone https://github.com/Vunguyen204/LuzzShop.git
cd LuzzShop
```

### 2. Cài đặt Backend

```bash
cd Backend
npm install
```

Tạo file `.env` trong thư mục `Backend`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=luzzshop
JWT_SECRET=your_jwt_secret
```

Chạy Backend:

```bash
npm start
```

Backend chạy tại:

```bash
http://localhost:5000
```

### 3. Cài đặt Frontend

Mở terminal mới:

```bash
cd Frontend
npm install
npm run dev
```

Frontend chạy tại:

```bash
http://localhost:5173
```

## Database

Dự án sử dụng MySQL. Một số bảng chính:

- `users`
- `roles`
- `products`
- `categories`
- `brands`
- `menus`
- `orders`
- `order_details`
- `wishlist`

Sau khi tạo database, import file SQL nếu có:

```bash
mysql -u root -p luzzshop < LuzzShop.sql
```

## API chính

```bash
GET     /api/products
GET     /api/products/:id
GET     /api/categories
GET     /api/brands
GET     /api/menus
POST    /api/auth/register
POST    /api/auth/login
GET     /api/admin/dashboard
GET     /api/admin/recent-orders
```

## Quy trình Git đề xuất

Khi bắt đầu làm chức năng mới:

```bash
git checkout develop
git pull origin develop
```

Sau khi làm xong:

```bash
git status
git add .
git commit -m "Hoan thanh chuc nang ..."
git push origin develop
```

Gộp sang nhánh main:

```bash
git checkout main
git pull origin main
git merge develop
git push origin main

## Tác giả

Nguyễn Đặng Như Vũ
GitHub: [Vunguyen204](https://github.com/Vunguyen204)

## Ghi chú

Dự án được xây dựng phục vụ học tập và thực hiện đồ án tốt nghiệp.
