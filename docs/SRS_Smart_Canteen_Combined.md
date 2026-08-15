# SMART CANTEEN SYSTEM REQUIREMENT SPECIFICATION (SRS)

## 3. DETAILED SYSTEM SPECIFICATION

---

### 3.2 CUSTOMER / STUDENT APPLICATION (Ứng dụng Sinh viên / Khách hàng)

---

#### 3.2.1 Login Page (`/login`)

Function Trigger
● User navigates directly to `/login`
● User clicks UI Button "Đăng nhập" on Header navigation bar

Function Description
● Authenticates Customer/Student via Email/Password or OAuth2 Google authentication.

Function Details
● Authentication & State Check:
○ If already authenticated → redirect to Home Page (`/`)
○ If errorMsg exists / failed auth → show error message toast
● Form Fields:
○ "Email" (`email`): Text input field (valid email string format)
○ "Mật khẩu" (`password`): Password input field with show/hide password toggle
○ "Quên mật khẩu?" → navigate to `/forgot-password`
● Actions:
○ "Đăng nhập" (disabled while loading "Đang đăng nhập...") → submits form data to `/api/Auth/login`
○ "Đăng ký ngay" → navigate to `/register`
○ "Tiếp tục với Google" → triggers Google OAuth2 authentication flow via `/api/auth/google`
● Associated Modals:
○ `GoogleCompleteProfileModal`: Displayed when user logs in via Google for the first time but lacks Phone Number or Student ID
● Validation Rules (`LoginSchema`):
○ `email`: Required, valid Email Regex format
○ `password` (`PasswordSchema`): Minimum 8 characters, at least 1 uppercase letter (`A-Z`), 1 digit (`0-9`), and 1 special character (`!@#$%^&*()`)
● Result:
○ Success:
■ "Đăng nhập thành công!"
■ Store Access/Refresh Tokens & update Zustand store (`useUser`)
■ Redirect to Home Page (`/`)
○ Fail:
■ 401 → "Email hoặc mật khẩu không chính xác."
■ 403 → Returns `errorCode` "AccountSuspended" or "AccountBanned" → show server reason toast & autoredirect to `/suspended`
■ Other → Show error message toast

Screen Layout
Figure 1 - Login Page

---

#### 3.2.2 Register Page (`/register`)

Function Trigger
● User clicks UI Button "Đăng ký ngay" on Login Page
● User navigates directly to `/register`

Function Description
● Allows students to enter their personal information and create a new account using email/password or register quickly.

Function Details
● Title & Header:
○ "Tạo tài khoản mới / Tham gia cộng đồng Smart Canteen để đặt món ăn nhanh chóng."
● Form Fields:
○ "Họ và tên" (`name`): Text input (minimum 2 characters)
○ "Email" (`email`): Text input with email format validation
○ "Mật khẩu" (`password`): Password input (follows `PasswordSchema`)
○ "Xác nhận mật khẩu" (`confirmPassword`): Password input (must match `password` 100%)
○ "Mã sinh viên" (`studentId`): Optional text input
○ "Ngày sinh" (`dateOfBirth`): Date picker (derived age between 10 and 100 years old)
○ "Số điện thoại" (`phoneNumber`): Text input (Vietnamese 10-digit phone regex `/^((\+84)|0)(3|5|7|8|9)+([0-9]{8})$/`)
○ "Chuyên ngành / Lớp" (`majorOrClass`): Optional text input
○ "Địa chỉ" (`address`): Optional text input
○ "Giới tính" (`gender`): Select dropdown (`1`: "Nam", `2`: "Nữ", `3`: "Khác")
● Actions:
○ "Tạo tài khoản" button (disabled while request is pending) → submits form data to `/api/Auth/register`
○ "Đã có tài khoản? Đăng nhập ngay" → navigate to Login Page (`/login`)
● Validation Rules (`RegisterSchema`):
○ Validates all required inputs using Zod prior to API call. `confirmPassword` must match `password` 100%
● Result:
○ Success:
■ "Đăng ký thành công!"
■ Autoredirect to Email Verification Page (`/verify-email`)
○ Fail:
■ 409 Conflict → "Email đã tồn tại trong hệ thống."
■ Other → Show error message toast

Screen Layout
Figure 2 - Register Page

---

#### 3.2.3 Email Verification Page (`/verify-email`)

Function Trigger
● User is redirected from Registration page upon creating a new account
● User clicks verification link in email or accesses `/verify-email`

Function Description
● Allows new students to enter the 6-digit OTP code received via email to activate their account.

Function Details
● Form Fields:
○ "Mã OTP" (`otp`): 6-digit numeric OTP input field
● Actions:
○ "Xác nhận OTP" button → Submits code to `/api/Auth/verify-email`
○ "Gửi lại mã OTP" button → Triggers 60-second cooldown timer and calls API to resend verification email
● Validation Rules:
○ `otp` must be exactly 6 numeric digits (`/^\d{6}$/`)
● Result:
○ Success:
■ Account verification status updated (`isActive = true`)
■ "Xác minh Email thành công!"
■ Redirect to Student Identity Verification (`/verification`) or Login Page (`/login`)
○ Fail:
■ 400 Bad Request → "Mã OTP không chính xác hoặc đã hết hạn."
■ Other → Show error message toast

Screen Layout
Figure 3 - Email Verification Page

---

#### 3.2.4 Student Identity Verification Page (`/verification`)

Function Trigger
● User navigates to `/verification` from Email Verification Page or User Profile Page

Function Description
● Allows students to upload proof photos of their official Student ID Card for admin verification and approval.

Function Details
● Form Fields & Banners:
○ Dropzone "Ảnh thẻ sinh viên" (`studentCardPhoto`): Image file upload input supporting PNG/JPG
○ UI Status Banner: Displays current verification state (`Pending` - "Hồ sơ đang được admin/staff xem xét. Bạn sẽ nhận thông báo khi có kết quả.", `Approved` - "Đã xác thực thành công!", `Rejected` - "Từ chối (kèm lý do)")
● Actions:
○ "Gửi xác minh sinh viên" button → Uploads image to Cloudinary and submits request to `/api/Verification/submit`
○ "Về trang chủ" button → Available when verification is approved, navigates to `/`
○ "Quay lại trang cá nhân" button → Available when verification is approved, navigates to `/profile`
● Validation Rules:
○ Image file size must not exceed 5MB. Must be valid image MIME format
● Result:
○ Success:
■ Submits verification request for admin review
■ "Đã gửi yêu cầu xác minh sinh viên!"
○ Fail:
■ Show error message toast

Screen Layout
Figure 4 - Student Identity Verification Page

---

#### 3.2.5 Forgot Password Page (`/forgot-password`)

Function Trigger
● User clicks UI Link "Quên mật khẩu?" on Login Page
● User navigates directly to `/forgot-password`

Function Description
● Allows users to request a password reset by entering their registered email address, after which the system sends a reset link to that email.

Function Details
● Title & Header:
○ "Quên Mật Khẩu / Nhập email của bạn để nhận liên kết đặt lại mật khẩu!"
● Form Fields:
○ "Email" (`email`): Text input with email format validation
● Actions:
○ "Gửi email đặt lại mật khẩu" button ("Đang gửi...") → Submits email to `/api/Auth/forgot-password`
○ "Đã có tài khoản? Đăng nhập" → navigate to Login Page (`/login`)
● Result:
○ Success:
■ "Email đã được gửi / Vui lòng kiểm tra email của bạn để đặt lại mật khẩu."
○ Fail:
■ 404 Not Found → "Email không tồn tại trên hệ thống."
■ Other → "Gửi email thất bại"

Screen Layout
Figure 5 - Forgot Password Page

---

#### 3.2.6 Reset Password Page (`/reset-password`)

Function Trigger
● User clicks password reset link containing key/token in email (`/reset-password?token=[token]`)

Function Description
● Allows users to securely set a new password after the system verifies the reset key, completing the password recovery process.

Function Details
● State Verification:
○ If no token: "Link không hợp lệ / Vui lòng kiểm tra email và thử lại." → navigate to Forgot Password Page (`/forgot-password`)
○ Verify token: "Đang xác thực..."
● Title & Header:
○ "Đặt lại mật khẩu / Nhập mật khẩu mới của bạn để đặt lại mật khẩu!"
● Form Fields:
○ "Mật khẩu mới" (`newPassword`): Password input with show/hide toggle
○ "Xác nhận mật khẩu mới" (`confirmPassword`): Password input with show/hide toggle
● Actions:
○ "Đặt lại mật khẩu" button → Submits token and new password to `/api/Auth/reset-password`
○ "Đã có tài khoản? Đăng nhập" → navigate to Login Page (`/login`)
● Validation Rules (`ResetPasswordSchema`):
○ `newPassword` must follow `PasswordSchema` (min 8 chars, 1 uppercase, 1 digit, 1 special char)
○ `confirmPassword` must match `newPassword` 100%
○ `token` parameter must be present in URL query string
● Result:
○ Success:
■ "Đặt lại mật khẩu thành công / Bạn có thể đăng nhập với mật khẩu mới."
■ Redirect to Login Page (`/login`)
○ Fail:
■ 400 Bad Request → "Mã khôi phục không hợp lệ hoặc đã hết hạn."
■ Other → "Đặt lại mật khẩu thất bại"

Screen Layout
Figure 6 - Reset Password Page

---

#### 3.2.7 Meal Sessions Page (`/session`)

Function Trigger
● User clicks UI navigation item "Phiên ăn" on top Header navigation bar or accesses `/session`

Function Description
● Allows students to browse all active and upcoming Meal Sessions grouped by date, with date filtering and session status visibility.

Function Details
● Elements & Filters:
○ Calendar Date Selector Bar: Horizontal scrollable date bar for selecting calendar dates
○ Session Cards (Sáng, Trưa, Tối): Displays session title, description, serving time range (`availableFrom` - `availableTo`), order opening window (`availableForOrder`), and meal icon
○ Status Badges: "ĐANG MỞ", "SẮP DIỄN RA", "ĐÃ CHỐT", "ĐÃ ĐÓNG", "HẾT HẠN"
● Actions:
○ Select Date: Filters meal sessions available for the selected calendar date
○ Click Meal Session Card: Navigates to `/menu?sessionId=[sessionId]` if session is active or available for ordering
● Validation Rules:
○ Expired or finalized sessions (`isFinalized = true` or current time passed `availableTo`) disable card interaction, render UI Badge "ĐÃ CHỐT" or "ĐÃ ĐÓNG", and prevent navigation to ordering
● Result:
○ Success:
■ Displays meal sessions list for selected date
■ Clicking an active session card redirects user to Session Detail & Menu Page (`/menu?sessionId=[id]`)
○ Fail / Empty:
■ No sessions found for selected date → Displays empty state message "Không có ca ăn nào trong ngày này."

Screen Layout
Figure 7 - Meal Sessions Page

---

#### 3.2.8 Meal Session Detail & Menu Page (`/menu?sessionId=[id]`)

Function Trigger
● User selects an active meal session card from `/session` page or navigates directly to `/menu?sessionId=[id]`

Function Description
● Allows students to view full session menu info, select template rules, filter categories, view food tray, and add dishes to cart.

Function Details
● Elements & Workspace:
○ Session Header Banner: Displays Session Title, Time Range (`availableFrom` - `availableTo`), Date, and Status badges ("ĐANG MỞ CHỌN MÓN", "SẮP DIỄN RA", "ĐÃ CHỐT ĐƠN")
○ Menu Template Selector: Horizontal template pill carousel (e.g. "Suất cơm cố định", "Thực đơn tự chọn")
○ Interactive Food Tray Workspace: Visual tray view supporting drag-and-drop dish placement, displaying selected item thumbnails and quantities
○ Category Filter Pills (`Category Pills`): Category tabs ("Tất cả", "Cơm", "Bún / Phở", "Đồ uống", "Tráng miệng") displaying current selected item counts and min/max category constraints (`isRequired`, `minQuantity`, `maxQuantity`)
○ Dish Search Bar: Realtime text search for filtering dishes by title or description
○ Dish Card Grid: Dish thumbnail, Dish title, Description, Unit price (Canteen Points / Xu), Quantity selected badge (`xN`), and UI Button "Thêm vào giỏ"
○ Floating Cart Button (FAB): Floating shopping cart button displaying current session item count
● Associated Modals:
○ `DishDetailModal`: Modal displaying detailed dish nutritional information, calories, allergens, and description
● Actions:
○ Select Template: Switches active meal template rule set
○ Click "Thêm vào giỏ" / Drag to Tray: Checks category rules and stock availability:
■ Valid → Adds dish to cart, updates Zustand store (`useCart`), bounces tray/cart animations, and displays UI Toast "Đã thêm [tên món] vào giỏ!"
■ Exceeded Category Limit → Blocks action and displays UI Toast error "Danh mục đã đạt giới hạn tối đa"
○ Remove / Drag out of Tray: Decrements quantity or removes dish from cart with UI Toast feedback
○ Click FAB Cart Button: Opens Cart drawer / navigates to `/cart`
● Validation & Business Rules:
○ Block dish selection if session is expired or finalized (`isFinalized = true` or `availableTo` passed)
○ Block dish selection if category `maxQuantity` is reached for the selected template
○ Disable dish card and show out-of-stock badge if dish `stockQuantity = 0`

Screen Layout
Figure 8 - Meal Session Detail & Menu Page

---

#### 3.2.9 Cart Page (`/cart`) & Slide-over Cart Drawer (`CartDrawer`)

Function Trigger
● User navigates to Cart Page via header cart icon or opens Cart drawer

Function Description
● Allows students to review, select, adjust quantities, and remove courses/dishes from cart before proceeding to checkout.

Function Details
● Layout & Panels:
○ Left panel — course/dish list:
■ Header: "Món ăn / Khóa học" + "Chọn tất cả" toggle checkbox. Checking selects all
■ Each row: individual checkbox, thumbnail, title, category/level, price, quantity stepper (`+` / `-`)
■ Trash button → removes the dish from the cart
○ Right panel — order summary:
■ Summary Box: "Đã chọn" + total price of selected items
■ "Tiến hành thanh toán" button: disabled when no items are selected
● Associated Modals:
○ `ConfirmRemoveItemModal`: Confirmation dialog before removing an item from the cart
● Actions:
○ Toggle Checkbox: Selects / deselects items for checkout
○ Quantity Stepper: Updates item count in Zustand Cart store (`useCart`)
○ Trash button: Removes dish from cart
■ Success → Toast success "Đã xóa khỏi giỏ hàng."
■ Error → Toast error "Không thể xóa khỏi giỏ hàng."
○ "Tiến hành thanh toán" button → Navigates to `/checkout` with selected items
● Result:
○ Success: Redirects user to Checkout page (`/checkout`)

Screen Layout
Figure 9 - Cart Page & Cart Drawer

---

#### 3.2.10 Checkout & Payment Page (`/checkout`)

Function Trigger
● User accesses the checkout page through either a direct purchase action or cart-based checkout action

Function Description
● Allows students to review selected dishes/courses, choose payment method, and complete purchase.

Function Details
● Layout & Panels:
○ Left panel:
■ Items list: thumbnail, title, category, quantity, price
■ Remove item: click "Trash" icon → remove from list
■ Payment method selector: - VNPAY: "Thanh toán qua ứng dụng ngân hàng hoặc thẻ ATM" - PayOS: "Hệ thống thanh toán nhanh chóng, bảo mật cao" - Wallet: "Thanh toán bằng số dư ví Smart Canteen - Tức thì"
○ Right panel:
■ "Tạm tính" + Total amount
■ Wallet Info (if Wallet selected): displays current balance; if balance < total amount → highlights warning error "Số dư không đủ / Cần thêm X VNĐ" + UI Button "Nạp tiền ngay"
■ "Thanh toán ngay" / "Xác nhận thanh toán" button
● Associated Modals:
○ `ConfirmPaymentModal`: Final order placement confirmation modal
○ `InsufficientBalanceModal`: Displayed when Wallet balance is insufficient, featuring UI Button "Nạp tiền ngay"
● Actions & Result:
○ Wallet Payment:
■ Success (200 OK) → Order created via `/api/Orders`, wallet balance deducted, QR Code & OTP generated → Autoredirect to Order Detail Page (`/orders/[id]`)
○ VNPAY / PayOS:
■ Redirects to external payment gateway URL
○ Fail:
■ Show error message "Không thể tạo đơn hàng"

Screen Layout
Figure 10 - Checkout & Payment Page

---

#### 3.2.11 Order History Page (`/orders`)

Function Trigger
○ User clicks navbar header link "Lịch sử đơn hàng" or navigates to `/orders`

Function Description
○ Overview dashboard displaying student's meal order history, summary KPI metrics, status filter tabs, date filter dropdown, text search, and order detail navigation.

Function Details
Layout & Elements:
○ Header Bar: Title "Lịch sử đơn hàng" with subtitle ("Theo dõi quá trình chuẩn bị và lịch sử tất cả các đơn món ăn"), realtime search input ("Tìm đơn hàng, ca ăn..."), and "Lọc ngày v" dropdown button
○ Summary Metrics Cards (`OrdersStats`):
■ "Tổng đơn hàng": Total order count (e.g., 53)
■ "Đang xử lý": Count of active preparing orders (e.g., 9)
■ "Hoàn thành": Count of completed retrieved orders (e.g., 4)
■ "Tổng xu đã tiêu": Cumulative points spent in canteen (e.g., 721 xu)
○ Status Filter Tabs (`Tabs`): Filter buttons showing order count badges: "Tất cả", "Chờ xử lý" (`0`), "Đang chuẩn bị" (`4`), "Sẵn sàng" (`1`), "Hoàn thành" (`2`), "Đã hủy" (`3`), "Quá hạn" (`7`)
○ Order Items Table / Card List:
■ Columns: `ĐƠN HÀNG & CA ĂN`, `TRẠNG THÁI`, `TỔNG TIỀN`, `THAO TÁC`
■ Order Card Row: Displays Order ID (`#...`), Session Name, Item Count, Placement Date/Time, Status Badge (`Đang chuẩn bị`, `Hoàn thành`, `Đã hủy`, `Quá hạn`), Refund approval badges (`Đã duyệt`, `Từ chối`), Total Amount (xu), and action buttons
Actions:
○ UI Button "Chi tiết >" (or click row) → Navigates to Order Detail page `/orders/[id]`
○ UI Button "Hủy / Hoàn tiền" → Opens refund request modal or navigates to `/refund?orderId=[id]`
Result:
○ Success: Displays paginated, filterable audit list of student orders fetched from `/api/Orders`

Screen Layout
Figure 11 - Order History Page

---

#### 3.2.12 Order Detail & Realtime Tracking Page (`/orders/[id]`)

Function Trigger
○ User clicks an order card from Order History (`/orders`) or is automatically redirected after completing checkout payment at `/checkout`

Function Description
○ Detailed realtime tracking workspace displaying order status progress, session serving time window, dish items list, QR Code & OTP pickup credentials, kitchen change proposal resolution, and order cancellation actions.

Function Details
Layout & Elements:
○ Navigation & Header: Back link (`← Quay lại đơn hàng`), Title "Chi tiết đơn hàng", Full Order ID, and live Status Badge (`Cấu hình Đang chế biến`, `Chờ xử lý`, `Sẵn sàng lấy món`, `Hoàn thành`, `Đã hủy`, `Quá hạn`)
○ Session & Order Info Banner:
■ "CA / PHIÊN ĂN": Displays meal session name (e.g. "Bữa Trưa năng lượng mạnh")
■ "GIỜ PHỤC VỤ CA": Displays session serving window (e.g. "14:00 - 16:10", date)
■ "NGÀY GIỜ ĐẶT ĐƠN": Exact order placement timestamp
○ Order Items List ("Món ăn"): Thumbnail, Dish Name, Portion quantity (`Số lượng: X`), Unit price in Canteen Points (xu), and Item Status badge (`Đang xử lý`)
○ Summary Footer: Total Amount (`Tổng tiền`), Transaction ID (`Mã giao dịch`)
○ QR Code & OTP Pickup Credentials Card: Dynamically rendered when order reaches `ReadyForPickup` (`1`), enabling automated meal retrieval at smart canteen pickup slots or manual counter
○ Kitchen Proposal Panel: Renders out-of-stock warning banner and action buttons if kitchen staff issued a substitution proposal
Actions:
○ UI Button "Yêu cầu hủy & hoàn tiền đơn hàng" → Opens `RefundModal` to cancel order and request wallet refund
○ UI Button "Xác nhận đã nhận" → Confirms meal retrieval, updating order status to `Completed` (`2`)
○ Respond to Kitchen Change Proposal:
■ "Đồng ý đổi món" (`SwapItem`) → Opens `SwapItemModal` to select replacement dish
■ "Từ chối đổi món & Hoàn tiền món" (`RefundItem`) → Credits specific dish value to wallet
■ "Từ chối đổi món & Hủy toàn bộ đơn" (`RefundOrder`) → Cancels entire order with full wallet refund

Screen Layout
Figure 12 - Order Detail Page

---

#### 3.2.13 Wallet & Topup Page (`/wallet` / `/profile?tab=wallet`)

Function Trigger
○ User clicks UI Wallet balance card on Header or navigates to `/profile` (Tab "Ví & Thẻ của tôi") / `/wallet`

Function Description
○ Allows students to check available wallet balance, customize virtual canteen card theme, view recent transactions, select topup presets, choose payment methods, and execute instant VietQR payment topups.

Function Details
Layout & Sub-tabs:
○ Sub-tab "Tổng quan" (Overview):
■ Header: Displays available balance (`SỐ DƯ KHẢ DỤNG`) in Canteen Points (xu / VNĐ)
■ Virtual Canteen Card Preview: Displays customized card theme, card number, and student name
■ Card Theme Customizer ("Tùy chỉnh giao diện thẻ"): Allows choosing from 12 card design themes
■ Recent Transactions Panel ("Giao dịch gần đây"): Paginated list of recent order payments, topups, and refund credits with link to full history ("Xem tất cả giao dịch")
○ Sub-tab "Nạp tiền" (Top Up Wallet):
■ Amount Preset Buttons: `20.000`, `50.000`, `100.000`, `200.000`, `500.000` or custom amount input (e.g. `50000`)
■ Rate Conversion Note: "Bạn sẽ nhận được khoảng X Point (1 Point = 1.000 VND)"
■ Payment Method Selectors: "Chuyển khoản ngân hàng" (active), "MoMo" (Sắp ra mắt), "ZaloPay" (Sắp ra mắt), "VNPay" (Sắp ra mắt)
■ Action Button: "+ Nạp tiền [Số tiền] VND" (submits to `/api/Payments/top-up`)
○ VietQR Topup Result State (Post-submit):
■ Transaction Summary Card: Displays "Tạo nạp tiền thành công!", Transaction ID (`SC...`), converted points (`50.000 VND → 50 xu`), and status (`Pending`)
■ VietQR Scan Panel: Dynamically generated VietQR code card (Napas247 / TPBank) for instant mobile banking app scanning
■ Transfer Content Box: Displays exact transfer syntax (`TKPSCN [TransactionID]`) with one-click copy button
■ UI Button "Nạp thêm": Resets form to initiate a new topup transaction
Actions:
○ UI Button "+ Nạp tiền [Số tiền] VND" → Initiates topup request to `/api/Payments/top-up` and displays VietQR card
○ UI Button "Copy nội dung chuyển khoản" → Copies transfer syntax (`TKPSCN...`) to clipboard
○ UI Button "Nạp thêm" → Resets topup workspace
○ UI Link "Xem tất cả giao dịch" → Navigates to `/wallet/transactions`
Result:
○ Success: Renders live VietQR code with exact transfer syntax
○ Failure: Displays UI Toast error "Không thể tạo giao dịch nạp tiền."

Screen Layout
Figure 13 - Wallet & Topup Page

---

#### 3.2.14 Wallet Transaction History Page (`/wallet/transactions`)

Function Trigger
○ User clicks UI Link "Xem tất cả giao dịch" on Wallet page or navigates to `/wallet/transactions`

Function Description
○ Displays complete audit log of all wallet transactions (Topups, Order payments, Refund credits) with realtime balance tracking and category filters.

Function Details
Layout & Elements:
○ Page Header: "Lịch sử giao dịch ví" with Back button (`←`) and transaction counter (`Hiển thị X trên tổng số Y giao dịch`)
○ Transaction Filter Tabs: "Tất cả", "Nạp tiền", "Thanh toán", "Hoàn tiền"
○ Transaction Items List:
■ Direction Arrow Icon: Red `↗` for payments / Green `↙` for topups and refunds
■ Transaction Title & Type Badge: e.g. "Thanh toán đơn hàng" (red badge), "Hoàn tiền đơn hàng" (green badge), "Nạp tiền vào ví" (blue badge)
■ Timestamp & Balance Progression: Exact time (`HH:mm DD/MM/YYYY`) and balance change tracking (`Số dư: [Trước] → [Sau]`)
■ Amount Display: Red negative amount (`-38 xu`) for payments or green positive amount (`+32 xu`) for topups/refunds
Actions:
○ Click Filter Tabs: Filters transaction list by category ("Tất cả", "Nạp tiền", "Thanh toán", "Hoàn tiền")
○ Click Back Button (`←`): Navigates back to Profile / Wallet page (`/profile?tab=wallet`)
Result:
○ Success: Displays paginated audit log of wallet transactions fetched from `/api/wallet-transactions`

Screen Layout
Figure 14 - Wallet Transaction History Page

---

#### 3.2.15 Quick Order Cancellation & Refund Modal (`/orders/[id]`)

Function Trigger
○ User clicks UI Button "Yêu cầu hủy & hoàn tiền" inside Order Detail Page (`/orders/[id]`)

Function Description
○ Pop-up modal allowing students to instantly select a refund policy reason, attach optional manager notes, and submit a refund claim for an order without leaving the order tracking page.

Function Details
Layout & Modal Elements:
○ Modal Header: Title "Yêu cầu hủy & hoàn tiền" with Order ID preview (`#...`) and close icon (`✕`)
○ Estimated Refund Banner: Yellow card displaying "SỐ TIỀN SẼ ĐƯỢC HOÀN TRẢ" (e.g. `38 xu`) and payout note ("Tiền sẽ được cộng trực tiếp vào ví sau khi quản lý duyệt.")
○ Refund Reason Selector ("LÝ DO HỦY ĐƠN \*"): Radio selection list of active canteen refund policies (`policyCode` - e.g. "Change proposal item refund", "Full refund without image", "Hư Hỏng", "Không còn nhu cầu", "Thiếu món", "Vấn đề vệ sinh thực phẩm")
○ Additional Notes Input ("GHI CHÚ THÊM (KHÔNG BẮT BUỘC)"): Textarea for custom notes to canteen manager
Actions:
○ UI Button "Xác nhận gửi yêu cầu" → Submits refund claim payload to `/api/refunds` for manager approval queue
○ UI Button "Hủy bỏ" → Closes modal without submitting payload
Result:
○ Success: Displays UI Toast "Đã gửi yêu cầu hủy đơn thành công!", updating order refund status badge
○ Failure: Displays UI Toast "Không thể gửi yêu cầu hủy đơn."

Screen Layout
Figure 15 - Quick Order Cancellation & Refund Modal

---

#### 3.2.16 Detailed Refund Claim Page (`/refund`)

Function Trigger
○ User accesses standalone refund URL `/refund?orderId=[id]` or selects refund claim link from notifications / order history

Function Description
○ Allows students to submit a formal refund claim for damaged meals, missing items, or quality issues, complete with detailed text description and up to 5 evidence proof photos.

Function Details
Layout & Form Fields:
○ Navigation Header: Back link (`← Quay lại`), Title "Yêu cầu hoàn tiền", and Order ID preview (`Mã đơn: ...`)
○ Refund Reason Grid ("Lý do hoàn tiền _"): 2-column interactive radio selection grid of canteen refund policies (`policyCode` - e.g. "Change proposal item refund", "Full refund without image", "Hư Hỏng", "Không còn nhu cầu", "Thiếu món", "Vấn đề vệ sinh thực phẩm")
○ Issue Description Area ("Mô tả chi tiết _"): Textarea input ("Mô tả vấn đề bạn gặp phải...") with real-time character counter ("0 ký tự (tối thiểu 10 ký tự)")
○ Evidence Photo Dropzone ("Hình ảnh minh chứng"): Photo upload component supporting up to 5 proof images (`Tải ảnh 0/5`)
Actions:
○ UI Button " Gửi yêu cầu hoàn tiền" → Uploads evidence photos to Cloudinary and submits claim payload to `/api/refunds` for manager approval
Result:
○ Success: Displays UI Toast "Đã gửi yêu cầu hoàn tiền thành công!" and redirects user to Order History (`/orders`)
○ Failure: Displays UI Toast "Gửi yêu cầu hoàn tiền thất bại."

Screen Layout
Figure 16 - Detailed Refund Claim Page

---

#### 3.2.17 Change Proposals Dashboard Page (`/change-proposals`)

Function Trigger
○ User receives system notification when an ordered dish runs out during tray assembly, or navigates to `/change-proposals`

Function Description
○ Displays a consolidated dashboard of all pending and resolved kitchen dish substitution proposals for the student's orders.

Function Details
Layout & Elements:
○ Page Header: "Đề xuất đổi món" with pending proposals counter ("Bạn có X đề xuất đang chờ xử lý") and "Làm mới" refresh button
○ Grouped Order Proposal Cards: Displays Order ID (`#...`), Session Name, Serving Time Range, and item proposal resolution badges (`Đã đổi món`, `Đã hoàn tiền món`, `Đã hoàn tiền & hủy đơn`)
○ Action Link: "Xem đơn hàng >" (navigates directly to the specific order detail page `/orders/[id]`)
Result:
○ Success: Displays real-time list of dish change proposals grouped by order

Screen Layout
Figure 17 - Change Proposals Dashboard Page

---

#### 3.2.18 Order Item Dish Swap Modal (`SwapItemModal` on `/orders/[id]`)

Function Trigger
○ User clicks UI Action Button "Làm mới Đổi món" on an out-of-stock dish alert banner inside Order Detail Page (`/orders/[id]`)

Function Description
○ Pop-up modal allowing students to select a candidate replacement dish from the same meal session or execute item refund resolution.

Function Details
Layout & Modal Elements:
○ Item Alert Banner (Order Detail): "Món này bị thiếu số lượng! Vui lòng chọn hành động thay thế." with button "Làm mới Đổi món"
○ Modal Header: "Chọn Món Thay Thế" showing target out-of-stock dish name ("Đổi món: [Tên món]")
○ Available Replacements Grid: Candidate replacement dishes in the same meal session, displaying thumbnails, item names, prices in Canteen Points (xu), and "Chọn →" selection buttons
Actions:
○ UI Action "Chọn →" (inside Modal) → Confirms replacement dish selection and updates order item
○ UI Action "Từ chối đổi món & Hoàn tiền món" (`RefundItem`) → Credits out-of-stock dish value back to student wallet
○ UI Action "Từ chối đổi món & Hủy toàn bộ đơn" (`RefundOrder`) → Cancels entire order and refunds full amount to wallet
Result:
○ Success: Displays UI Toast "Đổi món thành công!" or "Đã hoàn tiền món vào ví!", updating order item status in real time

Screen Layout
Figure 18 - Order Item Dish Swap Selection Modal

---

#### 3.2.19 User Profile & Security Settings Page (`/profile`)

Function Trigger
○ User selects UI Avatar menu option "Hồ sơ cá nhân" or navigates to `/profile`

Function Description
○ Manage personal profile details, inspect email/identity verification status badges, switch wallet tabs, and update security password.

Function Details
Layout & Side Menu Structure:
○ Left Sidebar Menu:
■ User Card: Avatar thumbnail, Full Name (`name`), and Role badge (`Người dùng`)
■ Navigation Items: "Thông tin cá nhân" (active tab), "Ví & Thẻ của tôi", "Đổi mật khẩu", "Đăng xuất"
○ Tab 1: Personal Info ("Thông tin cá nhân"):
■ Form Fields: "Họ và tên" (`name`), "Địa chỉ Email" (`email` - with green `Đã xác thực` badge), "Mã số sinh viên" (`studentId`), "Chuyên ngành / Lớp" (`majorOrClass`), "Số điện thoại" (`phoneNumber`), "Ngày sinh" (`dateOfBirth` date picker), "Giới tính" (`gender` select: Nam/Nữ/Khác), "Địa chỉ" (`address`)
■ Verification Status Section ("Trạng thái xác thực"): Displays status badges for "Xác thực Email" (`Đã xác thực`) and "Định danh tài khoản" (`Đã định danh` / `Đã xác thực`)
■ Actions: UI Button "Lưu thay đổi" (submits updates to `/api/Auth/me`) & "Hủy thay đổi" (resets form fields)
○ Tab 2: Wallet & Cards ("Ví & Thẻ của tôi"):
■ Layout: Displays current wallet balance summary, 12 virtual card design templates, topup shortcuts, and recent transaction history
○ Tab 3: Security Settings ("Đổi mật khẩu"):
■ Header: "Cài đặt bảo mật"
■ Form Fields: "MẬT KHẨU HIỆN TẠI" (`currentPassword`), "MẬT KHẨU MỚI" (`newPassword`), "XÁC NHẬN MẬT KHẨU" (`confirmPassword`) - all featuring show/hide password eye toggle icons (Chi tiết)
■ Actions: UI Button "Cập nhật mật khẩu" (submits change password payload to `/api/Auth/change-password`)
■ Validation (`ChangePasswordSchema`): `currentPassword` required; `newPassword` follows `PasswordSchema` (min 8 chars, 1 uppercase, 1 digit, 1 special char); `confirmPassword` matches `newPassword` 100%
■ Result: Success → UI Toast "Cập nhật mật khẩu thành công!"; Failure → "Mật khẩu hiện tại không chính xác."

Screen Layout
Figure 19 - User Profile & Security Settings Page

---

#### 3.2.20 Notifications Center & Dropdown (`/notifications`)

Function Trigger
○ User clicks UI Bell Icon (``) on Navbar or navigates to `/notifications`

Function Description
○ Displays realtime system notifications (order updates, dish change proposals, refund approvals, verification results) via SignalR WebSocket and API fallback.

Function Details
Layout & Features:
○ **Navbar Notification Dropdown** (`NotificationDropdown`):
■ Pop-up Panel: Quick list of 20 most recent notifications
■ Status Indicator: Unread red dot and highlight background
■ Quick Action: UI Button "Đánh dấu đã đọc" (marks all dropdown items as read)
■ Navigation Link: "Xem tất cả thông báo" (navigates to `/notifications`)
○ **Full Notifications Center Page** (`/notifications`):
■ Header: Title "Thông báo", page counter ("Trang X/Y"), and Back button (`←`)
■ Filter Tabs: "Tất cả" & "Chưa đọc"
■ Action Button: "Đọc tất cả" (marks all account notifications as read)
■ Notifications List: Title, message snippet, and relative timestamp ("Vài giây trước", "X phút trước")
■ Pagination Controls: "Trước" & "Sau" navigation buttons
Actions:
○ Click Notification Item: Marks item as read and auto-redirects user to target detail URL (e.g. Order Detail `/orders/[id]` or Proposals `/change-proposals`)
Result:
○ Success: Realtime update of unread count badge and list items

Screen Layout
Figure 20 - Notifications Center & Dropdown Page

---

### 3.3 MANAGER APPLICATION (Ứng dụng Quản lý Canteen `/manager`)

---

#### 3.3.1 Manager Dashboard Page (`/manager`)

Function Trigger
○ Canteen Manager authenticates and accesses `/manager` (or clicks Manager Dashboard link)

Function Description
○ Comprehensive executive dashboard displaying realtime business KPIs, revenue trends over time, active session statistics, top-selling dish analytics, refund claim rates, and order status breakdown charts.

Function Details
Layout & Elements:
○ Header & Export Bar: Title "Báo cáo", subtitle ("Báo cáo tổng quan, ca phục vụ, vấn đề đơn hàng và chính sách hoàn tiền"), and UI Action Button "Xuất báo cáo" (exports report data to Excel/CSV)
○ Date Range Preset Selector: Quick period tabs ("Hôm nay", "7 ngày", "30 ngày", "Tháng trước") and custom date range picker ("Tùy chọn")
○ Report Sub-tab Navigation: "Tổng quan" (active overview), "Ca phục vụ", "Vấn đề đơn hàng", "Chính sách hoàn tiền"
○ KPI Summary Metrics Cards:
■ "ĐƠN HÀNG": Total order count with percentage growth vs previous period (e.g. `144`, `+108.7%`)
■ "DOANH THU": Cumulative revenue currency value with growth trend (e.g. `288 đ`, `+251.2%`)
■ "KHIẾU NẠI": Total refund claim count (e.g. `119`)
■ "KHÁCH HÀNG": Active student customer count with trend (e.g. `6`, `-72.7%`)
■ "TỶ LỆ HOÀN TIỀN": Refund rate percentage with trend (e.g. `666.7%`)
■ "CA ĐANG HOẠT ĐỘNG": Active operational meal sessions count (e.g. `1`)
■ "MÓN BÁN CHẠY": Top performing dish name preview (e.g. "Gà nướng mật ong")
○ Interactive Analytics Charts:
■ "Doanh thu theo thời gian": Dual-axis time series line chart comparing Order Volume (`Đơn hàng`) vs Total Revenue (`Doanh thu`) with interactive date hover tooltips
■ "Món ăn bán chạy": Bar chart analyzing top sold dish quantities with filter toggles ("Món chạy nhất" / "Cầu mua nhiều")
■ "Đơn hàng theo trạng thái": Donut/Pie chart displaying order distribution across status states (`Pending`, `Preparing`, `Ready`, `Completed`, `Cancelled`)
Actions:
○ UI Button "Xuất báo cáo" → Generates and downloads export report file
○ Tab Filters → Switches between overview, session, order issue, and refund policy reporting views
Result:
○ Success: Real-time visualization of canteen business KPIs and interactive charts

Screen Layout
Figure 21 - Manager Dashboard Page

---

#### 3.3.2 Revenue & Session Reports Page (`/manager/reports`)

Function Trigger
○ Manager clicks UI Sidebar item "Báo cáo & Thống kê" or accesses `/manager/reports?tab=session`

Function Description
○ Analytics workspace for analyzing meal session performance, total orders placed, generated revenue vs refund losses, completion rates, and status history per meal session.

Function Details
Layout & Elements:
○ Header Bar: Title "Báo cáo ca phục vụ", subtitle ("Theo dõi doanh thu, số lượng đơn hàng và xu hướng đặt món theo từng ca"), and refresh button (`Làm mới`)
○ Search & View Switcher Bar: Realtime session search input ("Tìm kiếm ca phục vụ..."), "Tìm kiếm" action button, and view mode toggle buttons (" Bảng" Table view / " Thẻ" Card view)
○ Session Audit Table:
■ Columns: `TÊN CA PHỤC VỤ`, `THỜI GIAN HOẠT ĐỘNG`, `TỔNG ĐƠN HÀNG`, `DOANH THU`, `TỶ LỆ HOÀN THÀNH`, `TRẠNG THÁI`, `THAO TÁC`
■ Session Row Items: Displays Session Title (`Bữa xế chiều`, `Webcam + Arm`, `Bữa sáng lành mạnh`...), Session ID (`ID: ...`), Serving start/end timestamps, Total Orders (`X đơn`), Net Revenue & Refund losses (`0 đ`, `Hoàn: X đ`), Completion Rate badge (`100%`), Status Badges (`LIVE`, `ĐÃ ĐÓNG`, `ĐÃ CHỐT`), and detail view action icon (`Chi tiết`)
○ Associated Modal: `SessionReportDetailModal` displaying popular dish sales distribution, item breakdown, and refund losses for a clicked session
Actions:
○ Click Eye Icon (`Chi tiết`) → Opens `SessionReportDetailModal` to inspect deep session metrics
○ Toggle " Bảng" / " Thẻ" → Switches between table audit view and visual card grid
Result:
○ Success: Filterable, paginated audit list of meal session reports fetched from `/api/reports/sessions`

Screen Layout
Figure 22 - Revenue & Session Reports Page

---

#### 3.3.3 Meal Session Management Page (`/manager/sessions`)

Function Trigger
○ Manager clicks UI Sidebar item "Ca phục vụ" or accesses `/manager/sessions`

Function Description
○ Session management workspace for orchestrating daily meal sessions, viewing annual session activity heatmaps, monitoring 24-hour serving timelines, creating new meal sessions, and accessing session details.

Function Details
Layout & Features:
○ Header Bar: Title "Ca phục vụ", subtitle ("Quản lý và điều phối các phiên/ca ăn phục vụ.")
○ Annual Session Calendar Heatmap (`Lịch ca phục vụ`): Interactive 12-month heatmap calendar grid, year selector tabs (`2025`, `2026`, `2027`), total session counter, and selected date indicator ("Đang chọn ngày: DD/MM/YYYY (X ca)")
○ Session Statistics Card (`Thống kê ca ăn`): Metrics for "TỔNG CA ĂN" (annual total), "TỶ LỆ PHỦ CA" (percentage coverage), and primary action button "+ Tạo ca ăn ngày DD/MM/YYYY" (navigates to session creation form `/manager/sessions/new`)
○ 24-Hour Serving Timeline Bar (`Khung giờ 24h & Ca ăn ngày`): Interactive horizontal 24h timeline graph displaying exact time slots of scheduled meal sessions across the day
○ Daily Meal Session Cards Grid: Session cards for selected date displaying Session Name, Serving time range (`Khung giờ: HH:mm - HH:mm`), Total dishes offered (`X món`), Finalization deadline (`Hạn chốt đơn: HH:mm`), active toggle switch, and detail navigation link ("Chi tiết ->" navigating to `/manager/sessions/[id]`)
○ Associated Modals / Forms:
■ `CreateSessionModal` / `new-session-form`: Form to create/copy session parameters, select dishes, auto-sync categories, and assign unique robot arm pickup lanes (`S1_L1`...)
■ `SlotConfigModal`: Modal to configure pickup slot assignments for the session
Actions:
○ UI Button "+ Tạo ca ăn ngày DD/MM/YYYY" → Opens session creation workflow
○ Click Session Card / "Chi tiết ->" → Navigates to Session Detail Page (`/manager/sessions/[id]`)
○ Click Heatmap Date Cell → Filters 24h timeline and session card grid by selected date
Result:
○ Success: Real-time visual timeline and calendar management of all canteen meal sessions

Screen Layout
Figure 23 - Meal Session Management Page

---

#### 3.3.4 Dish Management Page (`/manager/menu`)

Function Trigger
○ Manager clicks UI Sidebar item "Quản lý món ăn" or accesses `/manager/menu`

Function Description
○ Menu management workspace for performing CRUD operations on dishes, assigning categories, setting point prices, uploading high-resolution food images, and toggling availability.

Function Details
Layout & Elements:
○ Header Bar: Title "Thiết lập thực đơn", subtitle ("Quản lý thực đơn và điều chỉnh trạng thái các món ăn."), and primary action button "+ Món ăn mới"
○ Search & Filter Bar: Realtime dish name search input ("Tìm kiếm tên món ăn..."), category dropdown filter ("Tất cả danh mục v"), and view mode switcher (" Thẻ" Card grid view / " Bảng" Table list view)
○ Interactive Dish Cards Grid:
■ Image Thumbnail: High-resolution food photo
■ Dish Details: Dish Name (`BÁNH MÌ THẬP CẨM`, `BẮP LUỘC`, `BÒ LÚC LẮC`...), Category tag (`Thức ăn nhanh`, `Tinh bột`, `Đạm động vật`, `Rau củ...`), Unit Price in Canteen Points (xu)
■ Active Status Badge: Green toggle badge (`Bật` / `Tắt`)
■ Quick Action Icons: Edit Pencil icon (`Chỉnh sửa`) and Delete bin icon (`Xóa`)
○ Associated Modals:
■ `CreateDishModal`: Modal form to create new dish with title, description, category, unit price (Points), and Cloudinary image upload
■ `EditDishModal`: Modal form to update dish details, price, category, and photo
■ `DeleteDishConfirmModal`: Confirmation dialog before deleting a dish item
Actions:
○ UI Button "+ Món ăn mới" → Opens `CreateDishModal`
○ Click Edit Pencil Icon (`Chỉnh sửa`) → Opens `EditDishModal` for target dish
○ Click Delete Bin Icon (`Xóa`) → Opens deletion confirmation dialog
○ Click Active Status Badge (`Bật`/`Tắt`) → Toggles dish availability status
Result:
○ Success: Real-time update of dish menu items fetched from `/api/dishes`

Screen Layout
Figure 24 - Dish Management Page

---

#### 3.3.5 Category Management Page (`/manager/categories`)

Function Trigger
○ Manager clicks UI Sidebar item "Danh mục" or accesses `/manager/categories`

Function Description
○ Category management workspace for executing CRUD operations on food categories, assigning category cover images, descriptions, display order, and active state.

Function Details
Layout & Elements:
○ Header Bar: Title "Danh mục", subtitle ("Quản lý và thiết lập danh mục món ăn."), and primary action button "+ Danh mục mới"
○ Search Bar: Realtime category search input ("Tìm kiếm danh mục..."), "Tìm kiếm" action button, and view mode switcher (" Thẻ" Card grid view / " Bảng" Table list view)
○ Interactive Category Cards Grid:
■ Category Cover Image: Representative category food photo
■ Category Details: Category Title in uppercase (`ĐẠM ĐỘNG VẬT`, `ĐẠM THỰC VẬT`, `MÓN CHAY`, `RAU CỦ VÀ CHẤT XƠ`, `THỨC ĂN NHANH`, `TINH BỘT`, `TRÁI CÂY`...)
■ Category Description: Sub-description text explaining included food items (e.g. "Thịt, cá, hải sản, trứng", "Bánh, chè, pudding")
■ Quick Action Buttons: Edit Pencil icon (`Chỉnh sửa`) and Delete bin icon (`Xóa`)
○ Associated Modals:
■ `CreateCategoryModal`: Modal form to create new food category with title, description, display order, and image upload
■ `EditCategoryModal`: Modal form to edit category details and image
■ `DeleteCategoryConfirmModal`: Confirmation modal before removing a category
Actions:
○ UI Button "+ Danh mục mới" → Opens `CreateCategoryModal`
○ Click Edit Pencil Icon (`Chỉnh sửa`) → Opens `EditCategoryModal` for target category
○ Click Delete Bin Icon (`Xóa`) → Opens deletion confirmation modal
Result:
○ Success: Real-time update of canteen dish categories fetched from `/api/categories`

Screen Layout
Figure 25 - Category Management Page

---

#### 3.3.6 Order Management Page (`/manager/orders`)

Function Trigger
○ Manager clicks UI Sidebar item "Đơn hàng" or accesses `/manager/orders`

Function Description
○ Order monitoring workspace for filtering orders by meal session, searching by student name/order ID, monitoring revenue and order status metrics, and inspecting order details.

Function Details
Layout & Elements:
○ Header Bar: Title "Đơn Hàng", subtitle ("Theo dõi và quản lý đơn hàng theo từng ca phục vụ")
○ Session Selector Bar ("CHỌN CA PHỤC VỤ"): Scrollable session selector pills displaying session titles and order counts (e.g. "Bữa xế chiều [7]", "Bữa sáng lành mạnh [8]"), quick session search ("Tìm nhanh ca phục vụ..."), and date range picker ("Từ ngày - Đến")
○ Metric Summary Bar: "TỔNG ĐƠN" (Total orders count), "HOÀN THÀNH" (Green completed count box), "ĐÃ HỦY" (Red cancelled count box), "DOANH THU" (Blue currency box xu)
○ Search & Filter Controls: Realtime search input ("Tìm theo mã đơn, tên hoặc user ID..."), "Tìm kiếm" action button, status dropdown filter ("Tất cả", "Chờ xử lý", "Đang chuẩn bị", "Sẵn sàng", "Hoàn thành", "Đã hủy", "Hết hạn"), and refresh button (`Làm mới`)
○ Order Audit Table:
■ Columns: `#` (Order ID preview), `KHÁCH HÀNG` (Avatar thumbnail & Full Name), `MÓN ĂN` (Dishes list with quantities `DishName x1`), `TỔNG TIỀN` (xu), `TRẠNG THÁI` (`ĐÃ HỦY`, `ĐÃ HẾT HẠN`, `SẴN SÀNG`, `HOÀN THÀNH`), `THỜI GIAN` (HH:mm timestamp), `THAO TÁC` (`Chi tiết` Eye detail icon)
○ Associated Modals:
■ `ManagerOrderDetailModal`: Modal for inspecting order timeline, dish item statuses, and customer details
■ `EmergencyCancelOrderModal`: Modal to cancel order and execute full wallet refund in error scenarios
Actions:
○ Click Session Selector Pill → Filters order table by target meal session
○ Click Eye Icon (`Chi tiết`) → Opens `ManagerOrderDetailModal` for order details
Result:
○ Success: Real-time filterable, paginated audit list of canteen orders fetched from `/api/manager/orders`

Screen Layout
Figure 26 - Order Management Page

---

#### 3.3.7 Refund Requests Approval Page (`/manager/refunds`)

Function Trigger
○ Manager clicks UI Sidebar item "Yêu cầu hoàn tiền" or accesses `/manager/refunds`

Function Description
○ Refund claim approval workspace for reviewing student refund claims, inspecting attached proof images, and approving or rejecting claims with refund payout to Smart Canteen Wallet.

Function Details
Layout & Elements:
○ Header Bar: Title "Yêu cầu hoàn tiền", subtitle ("Phê duyệt hoặc từ chối các yêu cầu hoàn tiền của người dùng.")
○ Search & Filter Bar: Realtime search input ("Tìm theo user ID, tên khách, chính sách..."), "Tìm kiếm" action button, and status dropdown filter ("Tất cả trạng thái", "Chờ duyệt", "Đã duyệt", "Từ chối", "Tự động hoàn")
○ Refund Approval Audit Table:
■ Columns: `NGƯỜI DÙNG` (Full Name & User ID), `MÓN ĂN` (Dish name or "Toàn bộ đơn"), `CHÍNH SÁCH` (Policy code description e.g. "Full refund without image", "Change proposal item refund...", "Không còn nhu cầu"), `SỐ TIỀN HOÀN` (xu), `TỶ LỆ` (`100%`), `TRẠNG THÁI` (`TỰ ĐỘNG HOÀN` blue badge, `ĐÃ DUYỆT` green badge, `CHỜ DUYỆT` amber badge, `TỪ CHỐI` red badge), `NGÀY YÊU CẦU` (DD/MM/YYYY), `THAO TÁC` (`Chi tiết` Eye action icon)
○ Pagination Bar: Total request count indicator ("Hiển thị X–Y trong Z yêu cầu") and page numbers navigation (`< 1 2 3 ... N >`)
○ Associated Modals:
■ `RefundDetailsModal`: Inspects detailed claim information, reason text, and proof photo dropzone images
■ `ApproveRefundModal`: Confirms refund approval → System automatically credits refund amount to student's Smart Canteen Wallet via `/api/manager/refunds/[id]/approve`
■ `RejectRefundModal`: Confirms rejection and submits manager rejection reason `rejectionReason` via `/api/manager/refunds/[id]/reject`
Actions:
○ Click Eye Icon (`Chi tiết`) → Opens `RefundDetailsModal` to review claim proof photos and execute approval/rejection actions
○ Filter Status Dropdown → Filters table list by claim status (`Tự động hoàn`, `Đã duyệt`, `Chờ duyệt`, `Từ chối`)
Result:
○ Success: Real-time update of student refund claim statuses and wallet payouts

Screen Layout
Figure 27 - Refund Requests Approval Page

---

#### 3.3.8 Refund Policy Management Page (`/manager/refund-policies`)

Function Trigger
○ Manager clicks UI Sidebar item "Chính sách hoàn tiền" or accesses `/manager/refund-policies`

Function Description
○ Administrative workspace for configuring canteen refund policies, setting percentage refund rates, requiring proof photos, and managing policy codes.

Function Details
Layout & Elements:
○ Header Bar: Title "Refund Policies", subtitle ("Manage refund policy rules and percentages"), and primary action button "+ THÊM CHÍNH SÁCH MỚI"
○ Search Bar: Realtime search input ("Search by code, name or description...")
○ Refund Policies Table:
■ Columns: `CODE` (e.g. `PROPOSAL_ITEM_REFUND_NO_IMAGE`, `FULL_REFUND_NO_IMAGE`, `SPOILED`, `KHONG_CON_NHU_CAU`, `NOT_RECEIVED`, `MISSING_ITEM`), `NAME` (Display name e.g. "Change proposal item refund without image", "Hư Hỏng", "Không còn nhu cầu", "Thiếu món"), `DESCRIPTION`, `PERCENT` (`100%`, `20%`, `10%`, `5%`), `REQUIRES IMAGE` (Badge `Requires Image` / `—`), `ACTIONS` (Edit `Chỉnh sửa` & Delete `Xóa`)
○ Associated Modals:
■ `CreatePolicyModal`: Form modal to create a new refund policy rule
■ `EditPolicyModal`: Form modal to update policy name, percentage, description, and image requirement
■ `DeletePolicyConfirmModal`: Confirmation dialog to delete a policy rule
Actions:
○ UI Button "+ THÊM CHÍNH SÁCH MỚI" → Opens `CreatePolicyModal`
○ Click Edit Pencil Icon (`Chỉnh sửa`) → Opens `EditPolicyModal`
○ Click Delete Bin Icon (`Xóa`) → Opens deletion confirmation dialog
Result:
○ Success: Real-time update of canteen refund policy rules fetched from `/api/manager/refund-policies`

Screen Layout
Figure 28 - Refund Policy Management Page

---

#### 3.3.9 Hardware Control & Robot Arm Page (`/manager/robot`)

Function Trigger
○ Manager clicks UI Sidebar item "Tay máy Robot" or accesses `/manager/robot`

Function Description
○ Telemetry dashboard for monitoring robotic arms status, tracking heartbeat timestamps, assigning stations, and registering hardware stations.

Function Details
Layout & Elements:
○ Header Bar: Title "Robot Arms", subtitle ("Đăng ký và giám sát các tay máy phục vụ"), refresh button (`Làm mới`), and primary action button "+ ĐĂNG KÝ TAY MÁY"
○ Status Metric Cards: " Sẵn sàng", " Đang gắp món", " Gặp sự cố", " Bảo trì", " Ngoại tuyến"
○ Search & Session Filter Bar: Search input ("Tìm theo code, tên, IP..."), and session filter dropdown ("PHIÊN PHỤC VỤ: [SessionName] v")
○ Robot Arms Table:
■ Columns: `MÃ` (Station code e.g. `S1`, `S2`, `S3`), `TÊN TRẠM` (e.g. "Trạm đạm tốt", "Trạm súp, canh", "Trạm chất xơ"), `IP ADDRESS` (`192.168.58.2`), `STATION` (`Trạm 1`, `Trạm 2`, `Trạm 3`), `TRẠNG THÁI` (`Ngoại tuyến` grey badge, `Sẵn sàng` green badge), `HEARTBEAT` (Timestamp HH:mm DD-MM), `HÀNH ĐỘNG` (Edit `Chỉnh sửa` & Delete `Xóa`)
○ Associated Modals:
■ `RegisterRobotModal`: Form modal to register a new robotic arm station
■ `EditRobotModal`: Form modal to update robot arm IP address, station assignment, and status
Actions:
○ UI Button "+ ĐĂNG KÝ TAY MÁY" → Opens `RegisterRobotModal`
○ Click Edit Pencil Icon (`Chỉnh sửa`) → Opens `EditRobotModal`
Result:
○ Success: Real-time telemetry monitoring of canteen robotic arm hardware

Screen Layout
Figure 29 - Hardware Control & Robot Arm Page

---

#### 3.3.10 RFID Tray Pool Management Page (`/manager/trays`)

Function Trigger
○ Manager clicks UI Sidebar item "Pool Khay" or accesses `/manager/trays`

Function Description
○ Resource management workspace for monitoring physical RFID tray inventory, tracking order bindings, and registering new RFID tray tags.

Function Details
Layout & Elements:
○ Header Bar: Title "Pool Khay", subtitle ("Quản lý khay tài nguyên — mượn / trả tự động"), refresh button (`Làm mới`), and primary action button "+ ĐĂNG KÝ KHAY"
○ Status Metric Cards: "KHAY SẴN SÀNG" (Count), "ĐANG GIỮ ĐƠN" (Count), "ĐANG SỬ DỤNG" (Count)
○ Search Bar: Search input ("Tìm theo mã khay, trạng thái, đơn hàng...") and "Tìm kiếm" action button
○ Tray Inventory Table:
■ Columns: `MÃ KHAY` (`MINH01`, `SM01`, `SM02`, `TEST`, `TRAY001`...), `TRẠNG THÁI` (`Sẵn sàng` green badge, `Đang giữ đơn` yellow badge), `ĐƠN HIỆN TẠI` (Order ID preview `#...` or `—`), `CẬP NHẬT LÚC` (Timestamp HH:mm DD-MM), `THAO TÁC` (`Chi tiết` View detail icon)
○ Associated Modals:
■ `RegisterTrayModal`: Form modal to register a new RFID tray
■ `TrayDetailModal`: Modal showing detailed tray binding history and active order payload
Actions:
○ UI Button "+ ĐĂNG KÝ KHAY" → Opens `RegisterTrayModal`
○ Click Eye Icon (`Chi tiết`) → Opens `TrayDetailModal`
Result:
○ Success: Real-time tracking of RFID tray pool inventory

Screen Layout
Figure 30 - RFID Tray Pool Management Page

---

#### 3.3.11 Pickup Slots & Lockers Page (`/manager/slots`)

Function Trigger
○ Manager clicks UI Sidebar item "Ô Kệ Pickup" or accesses `/manager/slots`

Function Description
○ Hardware monitoring workspace for supervising smart canteen pickup locker doors, tracking order bindings, and registering new pickup locker slots.

Function Details
Layout & Elements:
○ Header Bar: Title "Ô Kệ Pickup", subtitle ("Quản lý ô kệ nơi khách đến lấy món"), refresh button (`Làm mới`), and primary action button "+ ĐĂNG KÝ Ô KỆ"
○ Status Metric Cards: "Ô TRỐNG" (Count), "ĐANG GIỮ ĐƠN" (Count)
○ Search Bar: Search input ("Tìm theo mã ô, trạng thái, đơn hàng...") and "Tìm kiếm" action button
○ Pickup Slots Table:
■ Columns: `MÃ Ô` (`CODX_..._SLOT_A`, `CODX_..._SLOT_B`, `SLOT01`, `SLOT02`...), `TRẠNG THÁI` (`Trống` green badge, `Đang giữ đơn` yellow badge), `ĐƠN HÀNG` (Order ID or `—`), `KHAY` (Tray ID or `—`), `BIND LÚC` (Timestamp HH:mm DD-MM)
○ Associated Modals:
■ `RegisterSlotModal`: Form modal to register a new pickup locker slot
■ `ForceOpenDoorModal`: Emergency manual unlock trigger for solenoid locker doors
Actions:
○ UI Button "+ ĐĂNG KÝ Ô KỆ" → Opens `RegisterSlotModal`
Result:
○ Success: Real-time hardware monitoring of smart pickup locker slots

Screen Layout
Figure 31 - Pickup Slots & Lockers Page

---

#### 3.3.12 Meal Session Lane & Robot Station Mapping Configuration Modal (`new-session-form` Step 2)

Function Trigger
○ Manager progresses to Step 2 ("Cấu hình Lane & Sức chứa") during meal session creation or editing

Function Description
○ Configuration modal allowing managers to assign unique hardware robot arm pickup lanes (`S1_L1`, `S1_L2`, `S1_L3`...), maximum tray capacities per dish, and designated robot arm stations.

Function Details
Layout & Form Fields:
○ Step Header: "TẠO CA PHỤC VỤ MỚI" - Step 2: "Cấu hình Lane & Sức chứa"
○ Configuration Instruction Box: "Cấu hình Lane & Sức chứa cho các món ăn trong ca" ("Gán Mã Lane ('S1_L1', 'S1_L2'...), sức chứa tối đa và Robot Arm phụ trách cho từng món ăn.")
○ Dish Lane Mapping Table:
■ Columns: `MÓN ĂN` (Dish title), `MÃ LANE` (Dropdown selecting unique lane codes `S1_L1`, `S1_L2`, `S1_L3`...), `SỨC CHỨA (KHAY)` (Numeric input, e.g. `12`), `TAY MÁY ROBOT` (Dropdown selecting robot arm station e.g. `S1 - Trạm đạm tốt`)
Actions:
○ Select Lane Dropdown → Auto-deduplicates and assigns unique lane code per dish
○ UI Button "Hoàn tất tạo ca" → Submits complete meal session configuration to `/api/sessions`
Result:
○ Success: Generates meal session with 100% unique robot arm lane codes and station parameters

Screen Layout
Figure 32 - Meal Session Lane & Robot Station Mapping Configuration Modal

---

#### 3.3.13 User Management Page (`/manager/users`)

Function Trigger
○ Manager clicks UI Sidebar item "Người dùng" or accesses `/manager/users`

Function Description
○ User management workspace for monitoring student and staff account lists, checking verification statuses, inspecting wallet balances, and performing account lock/ban/reactivate actions.

Function Details
Layout & Elements:
○ Header Bar: Title "Quản lý người dùng", subtitle ("Theo dõi tài khoản, xác thực, trạng thái khóa và các quy trình hỗ trợ"), and refresh button (`Làm mới`)
○ Metric Summary Cards: "SINH VIÊN HOẠT ĐỘNG" (Verified count), "NHÂN VIÊN" (Staff count), "BỊ KHÓA / CẤM" (Locked/Banned count)
○ Quick Action Navigation Bar: Link cards "Hàng đợi xác thực" (navigates to `/manager/verify`) and "Lịch sử hoàn tiền" (navigates to `/manager/refunds`)
○ Search & Filter Bar: Realtime search input ("Tìm theo tên, email hoặc mã sinh viên..."), role dropdown filter ("Tất cả vai trò"), status dropdown filter ("Tất cả trạng thái"), and "Tìm kiếm" button
○ User Audit Table:
■ Columns: `NGƯỜI DÙNG` (Avatar, Full Name, Email, StudentID), `VAI TR### 3.4 KITCHEN STAFF APPLICATION (Ứng dụng Nhân viên Bếp `/staff`)

---

#### 3.4.1 Staff Operations Dashboard Page (`/staff`)

Function Trigger
○ Kitchen Staff authenticates and accesses `/staff`

Function Description
○ Real-time operational control center for kitchen staff to monitor RFID tray pool levels, pickup locker availability, active robot arm lanes, robotic station health, and meal session order queues.

Function Details
Layout & Elements:
○ Top Header Bar: Global search bar ("Tìm kiếm dữ liệu đơn hàng, món ăn, sinh viên..."), Staff Profile badge ("Staff Smart Canteen" with green online indicator)
○ Dashboard Title Bar: Title "Trung Tâm Điều Hành", subtitle ("Giám sát thời gian thực thiết bị Robot, Khay đồ, Ô kệ nhận hàng và danh sách đơn hàng"), and refresh button (`Làm mới dữ liệu`)
○ Metric Telemetry Cards Row (4 Cards):
■ `KHAY ĐỒ (TRAYS POOL)`: Total tray inventory count, Available count ("Sẵn sàng: X"), Reserved count ("Đang giữ hàng: Y")
■ `Ô KỆ NHẬN HÀNG`: Total locker slots count, Empty count ("Trống: X"), Occupied count ("Có hàng: Y")
■ `LANE ROBOT TRONG CA`: Active lane count and assigned lane codes (e.g. `S2_L1, S2_L2`)
■ `CÁNH TAY ROBOT`: Total robotic arm station count and status health indicator ("Tất cả máy hoạt động tốt")
○ Section 1 - Robot Lane Configurations (`Cấu Hình Lane Robot`): Cards displaying Lane Code (`S1_L1`, `S2_L1`), Maximum Capacity ("Sức chứa: 12"), Assigned Dish ("Món gán: Bắp luộc", "Cơm trắng"), and Robot Station ("Robot: S1")
○ Section 2 - Robot Arm Stations (`Cánh Tay Robot Trạm Phục Vụ`): Station status cards displaying Station Title ("Trạm đạm tốt", "Trạm súp, canh", "Trạm chất xơ"), Station Code (`S1`, `S2`, `S3`), Station Index (`#1`, `#2`, `#3`), and Status Badge (`NGOẠI TUYẾN`, `SẴN SÀNG`)
○ Section 3 - Session Monitoring Selector (`CHỌN CA PHỤC VỤ CẦN GIÁM SÁT`): Scrollable session pills (`Webcam + Arm`, `Bữa xế chiều`...), quick search input, date range filter, and active session details banner ("Thực đơn: X món", "ĐÃ ĐÓNG")
○ Section 4 - Session Orders Audit Table (`Danh Sách Đơn Hàng Trong Phiên`):
■ Columns: `MÃ ĐƠN` (`#70b1da7e`...), `KHÁCH HÀNG` (Avatar & Full Name), `MÓN ĂN` (`Cơm trắng x1`), `TỔNG TIỀN` (xu), `TRẠNG THÁI` (`ĐÃ HẾT HẠN`, `SẴN SÀNG`, `ĐANG CHẾ BIẾN`), `THỜI GIAN`, `THAO TÁC` (`Chi tiết` View detail icon)
Actions:
○ Click Session Selector Pill → Filters live order table and lane configurations by selected meal session
○ UI Button "Làm mới dữ liệu" → Refreshes hardware telemetry and order queue status
Result:
○ Success: Real-time telemetry monitoring of all canteen kitchen hardware and order queue operations

Screen Layout
Figure 36 - Staff Operations Dashboard Page

---

#### 3.4.2 Staff Meal Sessions View Page (`/staff/sessions`)

Function Trigger
○ Staff clicks UI menu "Ca Phục Vụ" or accesses `/staff/sessions`

Function Description
○ Read-only meal session schedule workspace for kitchen staff to inspect daily serving windows, total offered dish counts, and session menus.

Function Details
Layout & Elements:
○ Header Bar: Title "Ca Phục Vụ", subtitle ("Xem thông tin và chi tiết các phiên/ca ăn phục vụ (Chế độ xem)")
○ Search & Filter Bar: Realtime session search input ("Tìm kiếm ca ăn..."), status filter tabs ("TẤT CẢ", "HOẠT ĐỘNG", "ĐÃ ĐÓNG")
○ Session Cards List:
■ Session Details: Title (`Bữa xế chiều`, `Webcam + Arm`, `Bữa sáng lành mạnh`...), Status Badge (`ĐÃ ĐÓNG` grey badge, `HOẠT ĐỘNG` green badge), Description ("cung cấp năng lượng cho nửa ngày còn lại"), Serving timestamps (`Bắt đầu: HH:mm DD/MM/YYYY`, `Kết thúc: HH:mm DD/MM/YYYY`), Total dishes tag (`X món`)
■ Action Link: "Xem chi tiết"
○ Associated Modal:
■ `StaffSessionDetailModal`: Modal pop-up over blurred background titled "CHI TIẾT CA PHỤC VỤ: [SessionName]", displaying start/end timestamps and a full grid of included dish items (`THỰC ĐƠN MÓN ĂN TRONG CA (X)` - dish photo thumbnail, dish name, price in xu, e.g. "Đậu hũ kho tiêu 12đ", "Bò lúc lắc 15đ")
Actions:
○ Click "Xem chi tiết" → Opens `StaffSessionDetailModal` to review session menu dishes
○ Filter Tabs ("TẤT CẢ", "HOẠT ĐỘNG", "ĐÃ ĐÓNG") → Filters session list by active status
Result:
○ Success: Real-time read-only inspection of meal session schedules and menus

Screen Layout
Figure 37 - Staff Meal Sessions View Page

---

#### 3.4.3 Bind Pickup Slot Page (`/staff/pickup-slots`)

Function Trigger
○ Staff clicks UI menu "Gán ô nhận hàng" or accesses `/staff/pickup-slots`

Function Description
○ Platform notice workspace informing kitchen staff that physical RFID tray-to-pickup-slot scanning and binding operations require the mobile application (`Smart Canteen App`), providing a QR code for mobile app download.

Function Details
Layout & Elements:
○ Header Bar: Title "Gán Ô Nhận Hàng (Bind Pickup Slot)", subtitle ("Tính năng gán ô nhận hàng trực tiếp tại khay cất đồ")
○ Platform Notice Card (`THÔNG BÁO NỀN TẢNG`):
■ Headline: Mobile device phone graphic and headline "Yêu cầu sử dụng Ứng dụng Di động"
■ Guidance Text: "Tính năng Gán ô nhận hàng (Bind Pickup Slot) hiện chưa hỗ trợ trên nền tảng Web. Vui lòng tải ứng dụng trên di động để thực hiện thao tác quét mã và gán ô nhanh chóng."
■ QR Code Download Card: Displays QR code graphic ("Quét mã QR để tải App"), compatible mobile OS information ("Tương thích với hệ điều hành Android & iOS"), and download button (`Smart Canteen App v2.0`)
Actions:
○ Scan QR Code / Click Download Button → Downloads `Smart Canteen Mobile App v2.0` for barcode/RFID hardware scanning
Result:
○ Success: Mobile app download redirection for hardware barcode/RFID slot scanning operations

Screen Layout
Figure 38 - Staff Bind Pickup Slot Page

---

#### 3.4.4 Staff Profile Page (`/staff/profile`)

Function Trigger
○ Staff clicks UI Sidebar item "Hồ sơ cá nhân" or accesses `/staff/profile`

Function Description
○ Profile and security management workspace for kitchen staff to update personal identity information (full name, phone, date of birth, gender, address) and change account security passwords.

Function Details
Layout & Elements:
○ Header Bar: Title "Hồ Sơ Cá Nhân", subtitle ("Quản lý thông tin tài khoản và bảo mật mật khẩu hệ thống")
○ Staff Profile Overview Card: Staff avatar thumbnail, Full Name ("Staff Smart Canteen"), Role badge (`Nhân Viên`), and Email badge (`staff.sc@gmail.com`)
○ Profile Settings Tabs:
■ `THÔNG TIN CÁ NHÂN` (Selected active tab)
■ `ĐỔI MẬT KHẨU` (Password change tab)
○ Personal Information Form Fields:
■ `ĐỊA CHỈ EMAIL`: Disabled email field (`staff.sc@gmail.com`)
■ `HỌ VÀ TÊN`: Editable text input
■ `SỐ ĐIỆN THOẠI`: Editable phone number input
■ `NGÀY SINH`: Date picker input (`DD/MM/YYYY`)
■ `GIỚI TÍNH`: Gender selection dropdown (`Nam`, `Nữ`)
■ `ĐỊA CHỈ LIÊN HỆ`: Contact address text input
○ Primary Action Button: "Lưu thay đổi"
Actions:
○ Switch Tab ("THÔNG TIN CÁ NHÂN" / "ĐỔI MẬT KHẨU") → Toggles between profile form and password security form
○ UI Button "Lưu thay đổi" → Submits profile modifications to `/api/staff/profile`
Result:
○ Success: Real-time update of kitchen staff profile information

Screen Layout
Figure 39 - Staff Profile Page

---

### 3.5 SYSTEM ADMIN APPLICATION (Ứng dụng Quản trị viên `/admin`)

---

#### 3.5.1 Admin Dashboard Page (`/admin`)

Function Trigger
○ System Admin authenticates and accesses `/admin`

Function Description
○ System telemetry control center for system administrators to monitor real-time API logs, server health response statuses, system exception monitoring, and token security authorization status.

Function Details
Layout & Elements:
○ Header Bar: Title "Bảng Điều Khiển Quản Trị", subtitle ("Giám sát nhật ký API, trạng thái máy chủ và an ninh hệ thống Smart Canteen."), and refresh button (`Làm mới`)
○ Metric Telemetry Cards Row (4 Cards):
■ `TỔNG NHẬT KÝ API`: Total API request count (e.g. `25.054`), database connection status indicator ("Đã kết nối cơ sở dữ liệu")
■ `TRẠNG THÁI MÁY CHỦ`: Server status badge ("Online" green badge), API response code ("API Backend Response 200 OK")
■ `HỆ THỐNG GIÁM SÁT`: Monitoring status ("Realtime" blue badge), automatic exception tracking ("Tự động bắt lỗi 4xx / 5xx")
■ `AN NINH & PHÂN QUYỀN`: Security status badge ("An toàn"), authorization mode ("Token Bearer Authorize Enabled")
○ Navigation Quick-Link Cards (2 Cards):
■ `Tất Cả Nhật Ký API`: Card with description ("Tra cứu danh sách toàn bộ các yêu cầu HTTP GET/POST, chi tiết Request & Response Body.") and navigation arrow (`->` navigating to `/admin/logs`)
■ `Giám Sát & An Ninh Hệ Thống`: Card with description ("Theo dõi phản hồi máy chủ, phân tích tải API và cảnh báo an ninh bảo mật hệ thống.") and navigation arrow (`->` navigating to `/admin/logs`)
Actions:
○ Click Link Card "Tất Cả Nhật Ký API" → Navigates to System Audit Logs Page (`/admin/logs`)
○ UI Button "Làm mới" (`Làm mới`) → Refreshes server telemetry metrics
Result:
○ Success: Real-time system health telemetry monitoring

Screen Layout
Figure 40 - Admin Dashboard Page

---

#### 3.5.2 System Audit Logs Page (`/admin/logs`)

Function Trigger
○ System Admin clicks UI menu "Nhật ký API" or accesses `/admin/logs`

Function Description
○ Real-time API audit trail workspace for inspecting system HTTP requests, searching logs by API endpoints/URL patterns, filtering by HTTP methods and status codes, and inspecting full JSON Request/Response telemetry payloads.

Function Details
Layout & Elements:
○ Header Bar: Title "Nhật Ký API", subtitle ("Hiển thị X bản ghi nhật ký hệ thống"), auto-refresh checkbox toggle ("Tự động làm mới (30s)"), and refresh button (`Làm mới`)
○ Search & Multi-Filter Bar:
■ Search Input: Realtime URL search input ("Tìm theo URL API (ví dụ: /api/orders, /api/auth)...")
■ Log Level Dropdown: `Mức: Tất cả` (`INFO`, `WARN`, `ERROR`, `FATAL`)
■ HTTP Method Dropdown: `Phương thức: Tất cả` (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
■ Error Code Checkbox/Filter: `Mã lỗi ≥ 400`
■ Date Range Picker: Start Date (`mm/dd/yyyy`) and End Date (`mm/dd/yyyy`)
■ Reset Filter Button: `Xóa bộ lọc`
○ API Audit Logs Table:
■ Columns: `THỜI GIAN` (HH:mm:ss DD-MM), `MỨC LOG` (`INFO` green badge, `WARN` amber badge, `ERROR` red badge), `URL API` (Endpoint path e.g. `/api/Auth/me`, `/api/notifications/unread-count`), `PHƯƠNG THỨC` (`GET` blue badge, `POST` green badge, `DELETE` pink badge), `MÃ TRẠNG THÁI` (`200` green badge, `400` amber badge, `500` red badge), `THỜI LƯỢNG` (Execution latency in ms, e.g. `14ms`, `28ms`, `399ms`), `THAO TÁC` (`Chi tiết` View detail eye icon)
○ Associated Modals & Drawers:
■ `LogDetailDrawer`: Slide-over drawer displaying complete raw JSON telemetry payload (Headers, Request Body, Response Body, Trace ID, User ID) for a selected log entry via `/api/admin/logs/[id]`
Actions:
○ Click Eye Icon (`Chi tiết`) → Opens `LogDetailDrawer` to inspect complete JSON telemetry payload
○ Toggle "Tự động làm mới (30s)" → Enables/disables automatic 30-second background polling
Result:
○ Success: Real-time search, filterable inspection of system HTTP API audit logs

Screen Layout
Figure 41 - System Audit Logs Page
