const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const generateCustomerToken = (customerId) =>
  jwt.sign({ customerId }, process.env.JWT_SECRET, { expiresIn: "30d" });

const normalizePhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+91${digits}`;
};

// ── POST /api/customer/check-phone ────────────────────────────────
// still useful — lets the frontend show "already registered, please
// login" vs "not registered yet" before submitting
const checkPhone = async (req, res) => {
  try {
    const { phone, restaurantId } = req.body;
    if (!phone || !restaurantId) {
      return res.status(400).json({ success: false, message: "Phone and restaurantId required" });
    }
    const normalizedPhone = normalizePhone(phone);
    const customer = await Customer.findOne({ phone: normalizedPhone, restaurantId });
    res.json({ success: true, exists: !!customer, phone: normalizedPhone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customer/register ───────────────────────────────────
// No OTP — phone + name only, account created immediately
const registerHandler = async (req, res) => {
  try {
    const { phone, username, restaurantId } = req.body;
    if (!phone || !username || !restaurantId) {
      return res.status(400).json({ success: false, message: "Phone, name and restaurantId are required" });
    }

    const normalizedPhone = normalizePhone(phone);
    const digits = normalizedPhone.replace(/\D/g, "");
    if (digits.length < 12) { // +91 plus 10 digits
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }

    const existing = await Customer.findOne({ phone: normalizedPhone, restaurantId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already registered for this restaurant. Please login." });
    }

    const customer = await Customer.create({
      phone: normalizedPhone,
      username: username.trim(),
      restaurantId,
      isOnline: true,
    });

    const token = generateCustomerToken(customer._id);
    res.status(201).json({
      success: true,
      message: `Welcome, ${customer.username}!`,
      token,
      customer: {
        _id: customer._id,
        username: customer.username,
        phone: customer.phone,
        restaurantId: customer.restaurantId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customer/login ──────────────────────────────────────
// No OTP — phone number alone identifies the returning customer
const loginHandler = async (req, res) => {
  try {
    const { phone, restaurantId } = req.body;
    if (!phone || !restaurantId) {
      return res.status(400).json({ success: false, message: "Phone and restaurantId required" });
    }

    const normalizedPhone = normalizePhone(phone);
    const customer = await Customer.findOne({ phone: normalizedPhone, restaurantId });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Not registered for this restaurant. Please register first." });
    }
    if (!customer.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    customer.isOnline = true;
    await customer.save();

    const token = generateCustomerToken(customer._id);
    res.json({
      success: true,
      message: `Welcome back, ${customer.username}!`,
      token,
      customer: {
        _id: customer._id,
        username: customer.username,
        phone: customer.phone,
        restaurantId: customer.restaurantId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customer/logout ─────────────────────────────────────
const logoutHandler = async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.customer._id, { isOnline: false });
    res.json({ success: true, message: "Logged out" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/customer/me ──────────────────────────────────────────
const getCustomerMe = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({
      success: true,
      customer: {
        _id: customer._id,
        username: customer.username,
        phone: customer.phone,
        restaurantId: customer.restaurantId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customer/identify ───────────────────────────────────
// Combined register-or-login by phone, used at checkout. A customer
// never explicitly "registers" anymore — providing name + phone to pay
// IS their account: created transparently the first time, recognized
// automatically every time after, on this same restaurant.
const identifyCustomer = async (req, res) => {
  try {
    const { phone, username, restaurantId } = req.body;
    if (!phone || !username || !restaurantId) {
      return res.status(400).json({ success: false, message: "Phone, name and restaurantId are required" });
    }

    const normalizedPhone = normalizePhone(phone);
    const digits = normalizedPhone.replace(/\D/g, "");
    if (digits.length < 12) {
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }

    let customer = await Customer.findOne({ phone: normalizedPhone, restaurantId });
    let isNew = false;

    if (customer) {
      if (!customer.isActive) {
        return res.status(403).json({ success: false, message: "Account is deactivated" });
      }
      customer.isOnline = true;
      await customer.save();
    } else {
      customer = await Customer.create({
        phone: normalizedPhone,
        username: username.trim(),
        restaurantId,
        isOnline: true,
      });
      isNew = true;
    }

    const token = generateCustomerToken(customer._id);
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? `Welcome, ${customer.username}!` : `Welcome back, ${customer.username}!`,
      token,
      customer: {
        _id: customer._id,
        username: customer.username,
        phone: customer.phone,
        restaurantId: customer.restaurantId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkPhone, registerHandler, loginHandler, logoutHandler, getCustomerMe, identifyCustomer };

// module.exports = { checkPhone, registerHandler, loginHandler, logoutHandler, getCustomerMe };