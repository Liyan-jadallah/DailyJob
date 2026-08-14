/**
 * ============================================
 * DAILY JOB - Jordan Job Posting Platform
 * Complete Production-Ready JavaScript (Fixed & Optimized)
 * ============================================
 */

(function () {
  "use strict";

  const BASE_URL = "https://dailyjob.onrender.com";

  const Api = {
    verifyEmail: async (email, otp) => {
      const res = await fetch(`${BASE_URL}/verify-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "الرمز غير صحيح");
      return data;
    },
    requestPasswordReset: async (email) => {
      const res = await fetch(`${BASE_URL}/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء الإرسال");
      return data;
    },
    confirmPasswordReset: async (email, otp, new_password) => {
      const res = await fetch(`${BASE_URL}/password-reset-confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "الرابط غير صالح أو منتهي الصلاحية");
      return data;
    },
    login: async (email, password) => {
      const res = await fetch(`${BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "بيانات الدخول غير صحيحة");
      return {
        token: data.token,
        user: { 
          id: data.user_id, 
          email: email, 
          username: data.username || email.split('@')[0] 
        }
      };
    },
    register: async (email, username, password) => {
      const res = await fetch(`${BASE_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.email?.[0] || data.username?.[0] || data.error || data.detail || "فشل في إنشاء الحساب، تحقق من البيانات.";
        throw new Error(errorMsg);
      }
      
      return data;
    },
    getAds: async () => {
      const res = await fetch(`${BASE_URL}/ads/`);
      if (!res.ok) return [];
      return await res.json();
    },
    createAd: async (adData, token) => {
      const res = await fetch(`${BASE_URL}/ads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(adData)
      });
      if (!res.ok) throw new Error("حدث خطأ أثناء النشر.");
      return await res.json();
    },
    deleteAd: async (adId, token) => {
      const res = await fetch(`${BASE_URL}/ads/${adId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!res.ok) throw new Error("حدث خطأ أثناء حذف الإعلان.");
      return true;
    },
    deleteAccount: async (userId, token) => {
      const res = await fetch(`${BASE_URL}/users/${userId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!res.ok) throw new Error("حدث خطأ أثناء حذف الحساب.");
      return true;
    }
  };

  const GOVERNORATES = [
    { key: "amman", ar: "عمّان", en: "Amman" },
    { key: "zarqa", ar: "الزرقاء", en: "Zarqa" },
    { key: "irbid", ar: "إربد", en: "Irbid" },
    { key: "balqa", ar: "البلقاء", en: "Balqa" },
    { key: "madaba", ar: "مادبا", en: "Madaba" },
    { key: "karak", ar: "الكرك", en: "Karak" },
    { key: "tafilah", ar: "الطفيلة", en: "Tafilah" },
    { key: "maan", ar: "معان", en: "Ma'an" },
    { key: "aqaba", ar: "العقبة", en: "Aqaba" },
    { key: "jerash", ar: "جرش", en: "Jerash" },
    { key: "ajloun", ar: "عجلون", en: "Ajloun" },
    { key: "mafraq", ar: "المفرق", en: "Mafraq" }
  ];

  const GOV_MAP = Object.fromEntries(GOVERNORATES.map((g) => [g.key, g]));

  const CATEGORIES = [
    { key: "daily", ar: "عمل يومي", en: "Daily Jobs", icon: "fa-bolt", color: "#FF6A00" },
    { key: "fulltime", ar: "وظائف دوام كامل", en: "Full-Time Jobs", icon: "fa-briefcase", color: "#1967D2" },
    { key: "ads", ar: "إعلانات وأخبار", en: "Ads & News", icon: "fa-rectangle-ad", color: "#C2185B" },
    { key: "services", ar: "خدمات", en: "Services", icon: "fa-hand-holding-hand", color: "#1565C0" },
    { key: "used", ar: "أشياء مستعملة", en: "Used Items", icon: "fa-comment-dots", color: "#546E7A" },
    { key: "free", ar: "هدايا مجانية", en: "Freebies", icon: "fa-gift", color: "#2E7D32" },
    { key: "construction", ar: "أعمال بناء", en: "Construction & Building", parent: "services" },
    { key: "delivery", ar: "توصيل", en: "Delivery & Courier", parent: "services" },
    { key: "cleaning", ar: "نظافة", en: "Housekeeping & Cleaning", parent: "services" },
    { key: "moving", ar: "نقل وأثاث", en: "Moving & Packing", parent: "services" },
    { key: "plumbing", ar: "سباكة وتدفئة", en: "Plumbing & Heating", parent: "services" },
    { key: "electrical", ar: "كهرباء", en: "Electrical Work", parent: "services" },
    { key: "hospitality", ar: "ضيافة ومطاعم", en: "Restaurants & Catering", parent: "services" },
    { key: "caregiving", ar: "رعاية أطفال", en: "Babysitting & Care", parent: "services" },
    { key: "electronics", ar: "إلكترونيات مستعملة", en: "Used Electronics", parent: "used" },
    { key: "furniture", ar: "أثاث مستعمل", en: "Used Furniture", parent: "used" },
    { key: "other", ar: "أخرى", en: "Other" }
  ];

  const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

  function getMainCategory(key) {
    const cat = CAT_MAP[key];
    return cat?.parent || cat?.key || key;
  }

  function getCategoryName(key, lang) {
    const cat = CAT_MAP[key];
    if (!cat) return key;
    return cat[lang] || cat.en;
  }

  const i18n = {
    en: {
      forgotPassword: "Forgot Password?",
      cliqAccount: "CliQ Account - Dinarak Wallet (Alias: DAILYJOB1)",
      cliqTransferMsg: "Please transfer 1 JOD to CliQ Account - Dinarak Wallet (Alias: <strong>DAILYJOB1</strong>) and upload the receipt below:",
      uploadReceipt: "Upload Receipt",
      confirmPaymentAndPublish: "Confirm Payment & Publish",
      receiptRequired: "Please upload the payment receipt",
      postAd: "Post Your Ad Now",
      all: "All",
      dailyJob: "Daily Jobs",
      fullTime: "Full-Time Jobs",
      announcements: "Ads & News",
      services: "Services",
      usedGoods: "Used Items",
      freebies: "Freebies",
      activeAds: "Active Listings",
      noResults: "No results match your search",
      adDetails: "Ad Details",
      jobDesc: "Description",
      contactWhatsapp: "Call or WhatsApp",
      abuDinar: "Abu Al-Dinar",
      abuDinarSub: "Best way to connect your service with employers and users",
      adTitle: "Ad Title",
      governorate: "Governorate",
      category: "Category",
      dailyWage: "Daily Wage / Price (JOD)",
      details: "Details",
      contactMethod: "Contact Method",
      phoneNumber: "Phone Number",
      postingFee: "Posting Fee",
      free: "Free",
      reviewFee: "Review Fee",
      total: "Total",
      publishAd: "Publish Ad - 1 JOD",
      favorites: "Favorites",
      noFavorites: "You haven't added any favorites yet",
      myAds: "My Listings",
      noAdsYet: "You haven't posted any ads yet",
      postFirstAd: "Post Your First Ad",
      notifications: "Notifications",
      markAllRead: "Mark All as Read",
      noNotifications: "No notifications at the moment",
      settings: "Settings",
      accountInfo: "Account Information",
      email: "Email Address",
      username: "Username",
      saveChanges: "Save Changes",
      notificationPrefs: "Notification Preferences",
      generalNotifs: "General Notifications",
      generalNotifsDesc: "Alerts about your account activity",
      newMessages: "New Messages",
      newMessagesDesc: "When you receive a message from a user",
      offersNews: "Offers & News",
      offersNewsDesc: "Offers and updates from Daily Job",
      preferredGov: "Preferred Governorate",
      chooseGovDefault: "Choose default governorate for displaying ads",
      deleteAccount: "Delete Account Permanently",
      confirmDeleteAd: "Are you sure you want to delete this ad permanently?",
      confirmDeleteAccount: "Are you sure you want to delete your account permanently? This action cannot be undone.",
      language: "Language",
      directionHint: "Direction changes automatically (LTR/RTL)",
      logout: "Log Out",
      home: "Home",
      login: "Login",
      register: "Register",
      loginSub: "Enter your email and password to continue",
      password: "Password",
      createAccount: "Create Account",
      registerSub: "Create your account in seconds - we only need these fields",
      confirmPassword: "Confirm Password",
      filterResults: "Filter Results",
      reset: "Reset",
      apply: "Apply",
      abuDinarCta: "Abu Al-Dinar - Post Ad",
      searchPlaceholder: "Search for jobs or used items...",
      minsAgo: "minutes ago",
      hoursAgo: "hours ago",
      daysAgo: "days ago",
      loginSuccess: "Logged in successfully",
      registerSuccess: "Account created successfully",
      logoutSuccess: "Logged out successfully",
      adPublished: "Your ad has been published successfully!",
      settingsSaved: "Settings saved successfully",
      fillAllFields: "Please fill in all fields",
      passwordsMismatch: "Passwords do not match",
      invalidEmail: "Invalid email address",
      invalidPhone: "Invalid phone number (10 digits)",
      titleRequired: "Title is required",
      wageRequired: "Wage is required",
      phoneRequired: "Phone number is required",
      contact: "Contact",
      myAd: "My Ad",
      removedFromFav: "Removed from favorites",
      addedToFav: "Added to favorites",
      filtersApplied: "Filters applied",
      filtersReset: "Filters reset",
      allMarkedRead: "All marked as read",
      sharingNotSupported: "Sharing not supported on this device",
      preferredGovUpdated: "Preferred governorate updated",
      usernameMinLength: "Username must be at least 3 characters",
      passwordMinLength: "Password must be at least 6 characters",
      guest: "Guest",
      signInToSeeMore: "Sign in to see more",
      whatsapp: "WhatsApp",
      call: "Phone Call",
      both: "Call or WhatsApp"
    },
    ar: {
      forgotPassword: "نسيت كلمة المرور؟",
      cliqAccount: "حساب كليك - محفظة دينارك (اسم مستعار: DAILYJOB1)",
      cliqTransferMsg: "يرجى تحويل 1 دينار إلى حساب كليك - محفظة دينارك (اسم مستعار: DAILYJOB1) وتحميل صورة الإيصال أدناه:",
      uploadReceipt: "تحميل الإيصال",
      confirmPaymentAndPublish: "تأكيد الدفع والنشر",
      receiptRequired: "الرجاء رفع صورة إيصال الدفع",
      postAd: "أنشر إعلانك الآن",
      all: "الكل",
      dailyJob: "شغل يومي",
      fullTime: "وظائف دوام كامل",
      announcements: "إعلانات وأخبار",
      services: "خدمات",
      usedGoods: "أغراض مستعملة",
      freebies: "هدايا مجانية",
      activeAds: "إعلانات نشطة",
      noResults: "لا توجد نتائج مطابقة لبحثك",
      adDetails: "تفاصيل الإعلان",
      jobDesc: "وصف العمل",
      contactWhatsapp: "اتصال أو واتساب",
      abuDinar: "أبو الدينار",
      abuDinarSub: "أفضل طريقة لتوصيل خدمتك بالمعلن والمستخدم",
      adTitle: "عنوان الإعلان",
      governorate: "المحافظة",
      category: "الفئة",
      dailyWage: "الأجر اليومي / السعر (د.أ)",
      details: "التفاصيل",
      contactMethod: "طريقة التواصل المباشر",
      phoneNumber: "رقم التواصل",
      postingFee: "رسوم نشر الإعلان",
      free: "مجانية",
      reviewFee: "مراجعة الإعلان",
      total: "المجموع",
      publishAd: "انشر الإعلان - 1 دينار",
      favorites: "المفضلة",
      noFavorites: "لم تضف أي إعلان للمفضلة بعد",
      myAds: "إعلاناتي",
      noAdsYet: "لم تنشر أي إعلان بعد",
      postFirstAd: "انشر أول إعلان",
      notifications: "الإشعارات",
      markAllRead: "تعليم الكل كمقروء",
      noNotifications: "لا توجد إشعارات حالياً",
      settings: "الإعدادات",
      accountInfo: "معلومات الحساب",
      email: "البريد الإلكتروني",
      username: "اسم المستخدم",
      saveChanges: "حفظ التغييرات",
      notificationPrefs: "تفضيلات الإشعارات",
      generalNotifs: "إشعارات عامة",
      generalNotifsDesc: "تنبيهات حول نشاط حسابك",
      newMessages: "رسائل جديدة",
      newMessagesDesc: "عندما تتلقى رسالة من مستخدم",
      offersNews: "العروض والأخبار",
      offersNewsDesc: "العروض والتحديثات من دايلي جوب",
      preferredGov: "المحافظة المفضلة",
      chooseGovDefault: "اختر المحافظة الافتراضية لعرض الإعلانات",
      deleteAccount: "حذف الحساب نهائياً",
      confirmDeleteAd: "هل أنت متأكد أنك تريد حذف هذا الإعلان نهائياً؟",
      confirmDeleteAccount: "هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع إعلاناتك.",
      language: "اللغة",
      directionHint: "الاتجاه يتغير تلقائياً (RTL/LTR)",
      logout: "تسجيل الخروج",
      home: "الرئيسية",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      loginSub: "أدخل بريدك الإلكتروني وكلمة المرور للمتابعة",
      password: "كلمة المرور",
      createAccount: "إنشاء حساب جديد",
      registerSub: "أنشئ حسابك خلال ثوانٍ - نحتاج هذه الحقول فقط",
      confirmPassword: "تأكيد كلمة المرور",
      filterResults: "تصفية النتائج",
      reset: "إعادة تعيين",
      apply: "تطبيق",
      abuDinarCta: "أبو الدينار - أضف إعلان",
      searchPlaceholder: "ابحث عن شغلة عامل أو عرض مستعمل...",
      minsAgo: "دقيقة مضت",
      hoursAgo: "ساعة مضت",
      daysAgo: "أيام مضت",
      loginSuccess: "تم تسجيل الدخول بنجاح",
      registerSuccess: "تم إنشاء الحساب بنجاح",
      logoutSuccess: "تم تسجيل الخروج",
      adPublished: "تم نشر إعلانك بنجاح!",
      settingsSaved: "تم حفظ الإعدادات",
      fillAllFields: "الرجاء تعبئة جميع الحقول",
      passwordsMismatch: "كلمتا المرور غير متطابقتين",
      invalidEmail: "البريد الإلكتروني غير صالح",
      invalidPhone: "رقم الهاتف غير صالح (10 أرقام)",
      titleRequired: "العنوان مطلوب",
      wageRequired: "الأجر مطلوب",
      phoneRequired: "رقم التواصل مطلوب",
      contact: "تواصل",
      myAd: "إعلاني",
      removedFromFav: "تم الإزالة من المفضلة",
      addedToFav: "تمت الإضافة إلى المفضلة",
      filtersApplied: "تم تطبيق الفلاتر",
      filtersReset: "تم إعادة تعيين الفلاتر",
      allMarkedRead: "تم تعليم الكل كمقروء",
      sharingNotSupported: "المشاركة غير مدعومة على هذا الجهاز",
      preferredGovUpdated: "تم تحديث المحافظة المفضلة",
      usernameMinLength: "يجب أن يكون اسم المستخدم 3 أحرف على الأقل",
      passwordMinLength: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
      guest: "زائر",
      signInToSeeMore: "سجّل دخولك لرؤية المزيد",
      whatsapp: "واتساب",
      call: "اتصال",
      both: "اتصال أو واتساب"
    }
  };

  const state = {
    lang: localStorage.getItem("dj_lang") || "en",
    isAuthenticated: false,
    user: null,
    pendingAction: null,
    favorites: new Set(JSON.parse(localStorage.getItem("dj_favorites") || "[]")),
    filters: {
      type: "all",
      category: "all",
      governorate: "all",
      query: ""
    },
    currentAdId: null,
    currentEditAdId: null,
    notifications: [],
    settings: {
      pushNotifications: true,
      messageNotifications: true,
      marketingNotifications: false,
      preferredGovernorate: "all"
    },
    tempEmail: null,
    resetUserEmail: ''
  };

  let ads = [];

  async function loadAdsFromAPI() {
    try {
      const dbAds = await Api.getAds();
      ads = dbAds.map(dbAd => ({
        id: dbAd.id,
        type: dbAd.category,
        category: dbAd.category,
        governorate: dbAd.governorate,
        area: { ar: dbAd.governorate, en: dbAd.governorate },
        title: { ar: dbAd.title, en: dbAd.title },
        desc: { ar: dbAd.description, en: dbAd.description },
        price: parseFloat(dbAd.price) || 0,
        currency: "JOD",
        wageType: "fixed",
        phone: dbAd.contact_phone,
        contactMethod: "both",
        createdAt: new Date(dbAd.created_at),
        user_email: dbAd.user_details?.email,
        mine: state.user && (dbAd.user === state.user.id || dbAd.user_details?.username === state.user.username),
        image: dbAd.image_url || 'https://placehold.co/400x300/e9ecef/495057?text=Daily+Job'
      }));
      renderAds();
    } catch (e) {
      console.error("Failed to load ads", e);
    }
  }

  function minsAgo(n) {
    return new Date(Date.now() - n * 60000);
  }

  state.notifications = [
    {
      id: "n1",
      icon: "fa-circle-check",
      title: { ar: "مرحباً بك في المنصة", en: "Welcome to the platform" },
      body: { ar: "لقد تم تهيئة المنصة للعمل مع الخادم الحقيقي بنجاح.", en: "Platform has been configured to work with the real server successfully." },
      minutesAgo: 1,
      read: false
    }
  ];

  const elements = {
    authOverlay: document.getElementById("authOverlay"),
    authStepLogin: document.getElementById("authStepLogin"),
    authStepRegister: document.getElementById("authStepRegister"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    filterOverlay: document.getElementById("filterOverlay"),
    cliqModalOverlay: document.getElementById("cliqModalOverlay"),
    toast: document.getElementById("toast")
  };

  function closeCliqModal() {
    if (elements.cliqModalOverlay) elements.cliqModalOverlay.classList.remove("open");
  }

  const cliqCloseBtn = document.getElementById("cliqModalClose");
  if (cliqCloseBtn) cliqCloseBtn.addEventListener("click", closeCliqModal);
  if (elements.cliqModalOverlay) {
    elements.cliqModalOverlay.addEventListener("click", (e) => {
      if (e.target === elements.cliqModalOverlay) closeCliqModal();
    });
  }

  function showAuthStep(stepId) {
    document.querySelectorAll('.auth-step').forEach(s => {
      s.classList.add('hidden');
    });
    
    const target = document.getElementById(stepId);
    if (target) {
      target.classList.remove('hidden');
    }

    const tLogin = document.getElementById("tabLogin");
    const tReg = document.getElementById("tabRegister");
    if (tLogin && tReg) {
      if (stepId === 'authStepLogin') {
        tLogin.classList.add("active");
        tReg.classList.remove("active");
      } else if (stepId === 'authStepRegister') {
        tReg.classList.add("active");
        tLogin.classList.remove("active");
      }
    }
  }

  function showLoginStep() { showAuthStep('authStepLogin'); }
  function showRegisterStep() { showAuthStep('authStepRegister'); }

  function openAuth(mode) {
    if (mode === "register") showRegisterStep();
    else showLoginStep();
    
    const lErr = document.getElementById("loginError");
    const rErr = document.getElementById("registerError");
    if (lErr) lErr.classList.add("hidden");
    if (rErr) rErr.classList.add("hidden");
    if (elements.authOverlay) elements.authOverlay.classList.add("open");
  }

  function closeAuth() {
    if (elements.authOverlay) elements.authOverlay.classList.remove("open");
  }

  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", async () => {
      const emailEl = document.getElementById("loginEmail");
      const passEl = document.getElementById("loginPassword");
      const errorEl = document.getElementById("loginError");

      if (!emailEl || !passEl) return;
      const email = emailEl.value.trim();
      const password = passEl.value;

      if (!email || !password) {
        showFormError(errorEl, t("fillAllFields"));
        return;
      }

      if (!isValidEmail(email)) {
        showFormError(errorEl, t("invalidEmail"));
        return;
      }

      const originalText = loginSubmitBtn.innerHTML;
      try {
        loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Loading...</span>';
        loginSubmitBtn.disabled = true;

        const result = await Api.login(email, password);

        state.isAuthenticated = true;
        state.user = result.user;

        localStorage.setItem("dj_user", JSON.stringify(state.user));
        localStorage.setItem("dj_token", result.token);

        closeAuth();
        updateDrawerUser();
        showToast(t("loginSuccess"), "success");
      
        loadAdsFromAPI();

        if (typeof state.pendingAction === "function") {
          const fn = state.pendingAction;
          state.pendingAction = null;
          fn();
        }

      } catch (error) {
        showFormError(errorEl, error.message || "Login failed. Please try again.");
      } finally {
        loginSubmitBtn.innerHTML = originalText;
        loginSubmitBtn.disabled = false;
      }
    });
  }

  const registerSubmitBtn = document.getElementById("registerSubmitBtn");
  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener("click", async () => {
      const emailEl = document.getElementById("regEmail");
      const userEl = document.getElementById("regUsername");
      const passEl = document.getElementById("regPassword");
      const confEl = document.getElementById("regConfirm");
      const errorEl = document.getElementById("registerError");

      if (!emailEl || !userEl || !passEl || !confEl) return;
      const email = emailEl.value.trim();
      const username = userEl.value.trim();
      const password = passEl.value;
      const confirm = confEl.value;

      if (!email || !username || !password || !confirm) {
        showFormError(errorEl, t("fillAllFields"));
        return;
      }

      if (!isValidEmail(email)) {
        showFormError(errorEl, t("invalidEmail"));
        return;
      }

      if (username.length < 3) {
        showFormError(errorEl, t("usernameMinLength"));
        return;
      }

      if (password.length < 6) {
        showFormError(errorEl, t("passwordMinLength"));
        return;
      }

      if (password !== confirm) {
        showFormError(errorEl, t("passwordsMismatch"));
        return;
      }

      const originalText = registerSubmitBtn.innerHTML;
      try {
        registerSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري الإنشاء...</span>';
        registerSubmitBtn.disabled = true;

        await Api.register(email, username, password);
        
        state.tempEmail = email;
        state.tempPassword = password;

        showToast("تم إرسال رمز التأكيد لبريدك!", "success");
        
        document.querySelectorAll('.auth-step').forEach(s => s.classList.add('hidden'));
        document.getElementById('authStepVerify').classList.remove('hidden');

      } catch (error) {
        showFormError(errorEl, error.message || "Registration failed. Please try again.");
      } finally {
        registerSubmitBtn.innerHTML = originalText;
        registerSubmitBtn.disabled = false;
      }
    });
  }

  function logout() {
    localStorage.removeItem("dj_user");
    localStorage.removeItem("dj_token");
    localStorage.removeItem("dj_favorites");
    
    state.isAuthenticated = false;
    state.user = null;
    state.favorites = new Set();
    
    updateDrawerUser();
    showToast(t("logoutSuccess"), "success");
    loadAdsFromAPI();
    goToScreen("home");
    closeDrawer();
  }

  const tLogin = document.getElementById("tabLogin");
  const tReg = document.getElementById("tabRegister");
  const authClose = document.getElementById("authClose");

  if (tLogin) tLogin.addEventListener("click", showLoginStep);
  if (tReg) tReg.addEventListener("click", showRegisterStep);
  if (authClose) authClose.addEventListener("click", closeAuth);
  if (elements.authOverlay) {
    elements.authOverlay.addEventListener("click", (e) => {
      if (e.target === elements.authOverlay) closeAuth();
    });
  }

  function goToScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    
    const targetScreen = document.getElementById("screen-" + name);
    if (targetScreen) targetScreen.classList.add("active");

    switch (name) {
      case "home": renderAds(); break;
      case "notifications": renderNotifications(); break;
      case "favorites":
        renderAdList("favList", "favEmptyState", ads.filter((a) => state.favorites.has(a.id)));
        break;
      case "mylistings":
        renderAdList("mineList", "mineEmptyState", ads.filter((a) => a.mine));
        break;
      case "settings": updateSettingsPage(); break;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    closeDrawer();
  }

  document.addEventListener("click", (e) => {
    const navEl = e.target.closest("[data-nav]");
    if (!navEl) return;

    e.preventDefault();
    const dest = navEl.dataset.nav;

    if (dest === "add") {
      state.currentEditAdId = null;
      const pSec = document.getElementById("paymentSection");
      const addForm = document.getElementById("addForm");
      const imgPrev = document.getElementById("imagePreviewList");
      if (pSec) pSec.style.display = "block";
      if (addForm) addForm.reset();
      if (imgPrev) imgPrev.innerHTML = "";

      const submitBtnSpan = document.querySelector("#submitAdBtn span");
      if (submitBtnSpan) {
        submitBtnSpan.setAttribute("data-i18n", "publishAd");
        submitBtnSpan.textContent = t("publishAd");
      }
    }

    if (navEl.hasAttribute("data-auth-required") && !state.isAuthenticated) {
      state.pendingAction = () => goToScreen(dest);
      openAuth("login");
      return;
    }

    goToScreen(dest);
  });

  function getFilteredAds() {
    const f = state.filters;
    return ads.slice()
      .filter((ad) => {
        if (f.type !== "all") {
          const adMainType = getMainCategory(ad.type);
          if (adMainType !== f.type) return false;
        }
        if (f.category !== "all" && f.category !== ad.category) return false;
        if (f.governorate !== "all" && ad.governorate !== f.governorate) return false;
        if (f.query) {
          const query = f.query.toLowerCase();
          const matchesTitle = ad.title[state.lang].toLowerCase().includes(query);
          const matchesDesc = ad.desc[state.lang].toLowerCase().includes(query);
          const matchesArea = ad.area[state.lang].toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc && !matchesArea) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function adCardHtml(ad) {
    const isFav = state.favorites.has(ad.id);
    const govName = GOV_MAP[ad.governorate] ? GOV_MAP[ad.governorate][state.lang] : ad.governorate;
    const mainCat = getMainCategory(ad.category);
    const catName = getCategoryName(mainCat, state.lang);
    
    let badgeClass = "badge-other";
    if (mainCat === "daily") badgeClass = "badge-daily";
    else if (mainCat === "fulltime") badgeClass = "badge-fulltime";
    else if (mainCat === "ads") badgeClass = "badge-ads";
    else if (mainCat === "services") badgeClass = "badge-services";
    else if (mainCat === "used") badgeClass = "badge-used";
    else if (mainCat === "free") badgeClass = "badge-free";
    
    let priceDisplay = "";
    if (ad.price === 0 || ad.type === "free") {
      priceDisplay = `<span class="ad-price free-price"><small>${t("free")}</small></span>`;
    } else {
      priceDisplay = `<span class="ad-price">${ad.price} <small>${ad.currency}</small></span>`;
    }
    
    return `
      <article class="ad-card ${ad.mine ? 'mine' : ''}" data-ad-id="${ad.id}">
        <div class="ad-image-wrapper">
          <img src="${ad.image || 'https://placehold.co/400x300/e9ecef/495057?text=Daily+Job'}" alt="Ad Cover">
        </div>
        ${ad.mine ? '<span class="ad-mine-tag">' + t("myAd") + '</span>' : ''}
        <div class="ad-card-top">
          <span class="ad-badge ${badgeClass}">${catName}</span>
          <h3 class="ad-title">${escapeHtml(ad.title[state.lang])}</h3>
          <button class="ad-fav-btn ${isFav ? 'is-fav' : ''}" data-fav-id="${ad.id}">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
        <div class="ad-meta-row">
          <span><i class="fa-regular fa-clock"></i>${formatRelative(ad.createdAt)}</span>
          <span><i class="fa-solid fa-location-dot"></i>${govName} - ${escapeHtml(ad.area[state.lang])}</span>
        </div>
        <div class="ad-bottom">
          <button class="ad-contact-btn" data-contact-id="${ad.id}">
            <i class="fa-brands fa-whatsapp"></i> ${t("contact")}
          </button>
          ${priceDisplay}
        </div>
      </article>`;
  }

  function renderAdList(containerId, emptyStateId, arr) {
    const list = document.getElementById(containerId);
    const empty = document.getElementById(emptyStateId);
    if (!list) return;

    if (!arr.length) {
      list.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
    } else {
      if (empty) empty.classList.add("hidden");
      list.innerHTML = arr.map(adCardHtml).join("");
    }

    list.querySelectorAll(".ad-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".ad-fav-btn") || e.target.closest(".ad-contact-btn")) return;
        openDetails(card.dataset.adId);
      });
    });

    list.querySelectorAll(".ad-fav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.favId);
      });
    });

    list.querySelectorAll(".ad-contact-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleContact(btn.dataset.contactId);
      });
    });
  }

  function renderAds() {
    const filtered = getFilteredAds();
    renderAdList("adsList", "homeEmptyState", filtered);

    const countEl = document.getElementById("resultsCount");
    if (countEl) countEl.textContent = `(${filtered.length})`;

    updateActiveFiltersDisplay();
  }

  function openDetails(adId) {
    if (!state.isAuthenticated) {
      state.pendingAction = () => {
        state.currentAdId = adId;
        renderDetails(adId);
        goToScreen("details");
      };
      openAuth("login");
      return;
    }

    state.currentAdId = adId;
    renderDetails(adId);
    goToScreen("details");
  }

  function renderDetails(adId) {
    const ad = ads.find((a) => a.id === adId);
    if (!ad) return;

    const isFav = state.favorites.has(ad.id);
    const govName = GOV_MAP[ad.governorate] ? GOV_MAP[ad.governorate][state.lang] : ad.governorate;
    const mainCat = getMainCategory(ad.category);
    const catName = getCategoryName(mainCat, state.lang);

    const detailsCard = document.querySelector(".details-card");
    if (detailsCard) {
      const oldImg = detailsCard.querySelector(".ad-details-image-wrapper");
      if (oldImg) oldImg.remove();

      const imgHtml = `
        <div class="ad-details-image-wrapper">
          <img src="${ad.image || 'https://placehold.co/800x400/e9ecef/495057?text=Daily+Job'}" alt="Ad Image">
        </div>`;
      detailsCard.insertAdjacentHTML("afterbegin", imgHtml);
    }

    const deleteAdBtn = document.getElementById("deleteAdBtn");
    if (deleteAdBtn) {
      if (state.user && state.user.email && ad.user_email && state.user.email.toLowerCase() === ad.user_email.toLowerCase()) {
        deleteAdBtn.classList.remove("hidden");
      } else {
        deleteAdBtn.classList.add("hidden");
      }
    }

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt("detailsTitle", ad.title[state.lang]);
    setTxt("metaTime", formatRelative(ad.createdAt));
    setTxt("metaLoc", `${govName} - ${ad.area[state.lang]}`);
    setTxt("descText", ad.desc[state.lang]);
    setTxt("priceCurrency", ad.currency);

    const priceBig = document.getElementById("priceBig");
    if (priceBig) {
      if (ad.price === 0 || ad.type === "free") {
        priceBig.textContent = t("free");
        priceBig.classList.add("is-free");
      } else {
        priceBig.textContent = ad.price;
        priceBig.classList.remove("is-free");
      }
    }

    const tagsContainer = document.getElementById("detailsTags");
    if (tagsContainer) {
      tagsContainer.innerHTML = `
        <span class="pill pill-orange">${catName}</span>
        <span class="pill pill-outline">${govName}</span>
      `;
    }

    const favBtn = document.getElementById("favBtn");
    if (favBtn) {
      favBtn.className = `icon-round ${isFav ? 'is-fav' : ''}`;
      favBtn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>`;
    }

    const phoneVal = document.getElementById("phoneValue");
    if (phoneVal) phoneVal.textContent = ad.phone;

    const callBtn = document.getElementById("callBtn");
    if (callBtn) callBtn.href = `tel:${ad.phone}`;
  }

  const contactBtnEl = document.getElementById("contactBtn");
  if (contactBtnEl) {
    contactBtnEl.addEventListener("click", () => {
      handleContact(state.currentAdId);
    });
  }

  function handleContact(adId) {
    const ad = ads.find((a) => a.id === adId);
    if (!ad || !ad.phone) return;
    const phoneNumber = `962${ad.phone}`;
    if (ad.contactMethod === "whatsapp" || ad.contactMethod === "both") {
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    } else if (ad.contactMethod === "call") {
      window.open(`tel:+${phoneNumber}`, "_blank");
    }
  }

  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      const ad = ads.find((a) => a.id === state.currentAdId);
      if (ad && navigator.share) {
        navigator.share({
          title: ad.title[state.lang],
          text: ad.desc[state.lang],
          url: window.location.href
        }).catch(() => {});
      } else {
        showToast(t("sharingNotSupported"), "info");
      }
    });
  }

  const favBtnDet = document.getElementById("favBtn");
  if (favBtnDet) {
    favBtnDet.addEventListener("click", () => {
      toggleFavorite(state.currentAdId);
      renderDetails(state.currentAdId);
    });
  }

  function toggleFavorite(adId) {
    if (state.favorites.has(adId)) {
      state.favorites.delete(adId);
      showToast(t("removedFromFav"), "info");
    } else {
      state.favorites.add(adId);
      showToast(t("addedToFav"), "success");
    }
    localStorage.setItem("dj_favorites", JSON.stringify([...state.favorites]));
    
    const activeScreen = document.querySelector(".screen.active");
    if (activeScreen && activeScreen.id === "screen-favorites") {
      renderAdList("favList", "favEmptyState", ads.filter((a) => state.favorites.has(a.id)));
    } else if (activeScreen && activeScreen.id === "screen-home") {
      renderAds();
    }
  }

  function openDrawer() {
    updateDrawerUser();
    if (elements.drawerOverlay) elements.drawerOverlay.classList.add("open");
  }

  function closeDrawer() {
    if (elements.drawerOverlay) elements.drawerOverlay.classList.remove("open");
  }

  function updateDrawerUser() {
    const nameEl = document.getElementById("drawerUserName");
    const subEl = document.getElementById("drawerUserSub");
    const authBtnLabel = document.getElementById("drawerAuthLabel");
    const avatarEl = document.getElementById("drawerAvatar");

    if (!nameEl) return;

    if (state.isAuthenticated && state.user) {
      nameEl.textContent = state.user.username;
      if (subEl) subEl.textContent = state.user.email;
      if (authBtnLabel) authBtnLabel.textContent = t("logout");
      if (avatarEl) {
        avatarEl.innerHTML = `<i class="fa-solid fa-user-check"></i>`;
        avatarEl.style.background = "var(--orange-tint)";
      }
    } else {
      nameEl.textContent = t("guest");
      if (subEl) subEl.textContent = t("signInToSeeMore");
      if (authBtnLabel) authBtnLabel.textContent = t("login");
      if (avatarEl) {
        avatarEl.innerHTML = `<i class="fa-regular fa-user"></i>`;
        avatarEl.style.background = "var(--orange-tint)";
      }
    }
  }

  const menuBtn = document.getElementById("menuBtn");
  const drawerClose = document.getElementById("drawerClose");
  const drawerAuthBtn = document.getElementById("drawerAuthBtn");

  if (menuBtn) menuBtn.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (elements.drawerOverlay) {
    elements.drawerOverlay.addEventListener("click", (e) => {
      if (e.target === elements.drawerOverlay) closeDrawer();
    });
  }
  if (drawerAuthBtn) {
    drawerAuthBtn.addEventListener("click", () => {
      closeDrawer();
      if (state.isAuthenticated) logout();
      else openAuth("login");
    });
  }

  function renderNotifications() {
    const list = document.getElementById("notifList");
    const emptyState = document.getElementById("notifEmptyState");
    if (!list) return;

    const unreadCount = state.notifications.filter(n => !n.read).length;
    const notifDot = document.getElementById("headerNotifDot");
    if (notifDot) {
      if (unreadCount > 0) notifDot.classList.remove("hidden");
      else notifDot.classList.add("hidden");
    }

    if (state.notifications.length === 0) {
      list.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    list.innerHTML = state.notifications.map((n) => `
      <div class="notif-item ${n.read ? "" : "unread"}" data-notif-id="${n.id}">
        <div class="notif-icon"><i class="fa-solid ${n.icon}"></i></div>
        <div class="notif-body">
          <div class="notif-title">${escapeHtml(n.title[state.lang])}</div>
          <div class="notif-text">${escapeHtml(n.body[state.lang])}</div>
          <div class="notif-time">${formatRelative(minsAgo(n.minutesAgo))}</div>
        </div>
      </div>`).join("");

    list.querySelectorAll(".notif-item").forEach(item => {
      item.addEventListener("click", () => {
        const notifId = item.dataset.notifId;
        const notif = state.notifications.find(n => n.id === notifId);
        if (notif) {
          notif.read = true;
          item.classList.remove("unread");
          updateNotificationDot();
        }
      });
    });
  }

  const markAllReadBtn = document.getElementById("markAllReadBtn");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
      state.notifications.forEach((n) => (n.read = true));
      renderNotifications();
      showToast(t("allMarkedRead"), "success");
    });
  }

  function updateNotificationDot() {
    const unreadCount = state.notifications.filter(n => !n.read).length;
    const notifDot = document.getElementById("headerNotifDot");
    if (notifDot) {
      if (unreadCount > 0) notifDot.classList.remove("hidden");
      else notifDot.classList.add("hidden");
    }
  }

  function populateFormSelects() {
    const govSelect = document.getElementById("fGovernorate");
    if (govSelect) {
      govSelect.innerHTML = GOVERNORATES.map((g) => `<option value="${g.key}">${g.en}</option>`).join("");
    }

    const settingsGovSelect = document.getElementById("settingsGov");
    if (settingsGovSelect) {
      settingsGovSelect.innerHTML = `
        <option value="all">— ${t("all")} —</option>
        ${GOVERNORATES.map((g) => `<option value="${g.key}">${g.en}</option>`).join("")}
      `;
    }

    const filterGovSelect = document.getElementById("filterGovSelect");
    if (filterGovSelect) {
      filterGovSelect.innerHTML = `
        <option value="all">— ${t("all")} —</option>
        ${GOVERNORATES.map((g) => `<option value="${g.key}">${g.en}</option>`).join("")}
      `;
    }

    const filterCategoryChips = document.getElementById("filterCategoryChips");
    if (filterCategoryChips) {
      const mainCategories = CATEGORIES.filter(c => !c.parent);
      filterCategoryChips.innerHTML = mainCategories.map((c) => 
        `<button type="button" data-cat="${c.key}" class="${state.filters.category === c.key ? 'active' : ''}">${c[state.lang]}</button>`
      ).join("");

      filterCategoryChips.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
          filterCategoryChips.querySelectorAll("button").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }
  }

  const editBtn = document.getElementById("editBtn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const ad = ads.find(a => a.id === state.currentAdId);
      if (!ad) return;

      state.currentEditAdId = ad.id;
      const pSec = document.getElementById("paymentSection");
      if (pSec) pSec.style.display = "none";

      const submitBtnSpan = document.querySelector("#submitAdBtn span");
      if (submitBtnSpan) {
        submitBtnSpan.setAttribute("data-i18n", "saveChanges");
        submitBtnSpan.textContent = t("saveChanges");
      }

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      };

      setVal("fTitle", ad.title.en);
      setVal("fGovernorate", ad.governorate);
      setVal("fCategory", ad.category);
      setVal("fWage", ad.price);
      setVal("fDetails", ad.desc.en);
      setVal("fContactMethod", ad.contactMethod);
      setVal("fPhone", ad.phone);

      goToScreen("add");
    });
  }

  async function performSave() {
    const btn = document.getElementById("confirmCliqBtn") || document.getElementById("submitAdBtn");
    const originalText = btn ? btn.innerHTML : '';
    try {
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;
      }

      const getVal = (id) => document.getElementById(id)?.value.trim() || "";

      const title = getVal("fTitle");
      const governorate = getVal("fGovernorate");
      const category = getVal("fCategory");
      const wage = getVal("fWage");
      const details = getVal("fDetails");
      const phone = getVal("fPhone");
      
      const imagesInput = document.getElementById("fImages");
      let base64Image = null;
      if (imagesInput && imagesInput.files && imagesInput.files[0]) {
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imagesInput.files[0]);
        });
      }

      const token = localStorage.getItem("dj_token");
      if (!token) throw new Error("يرجى تسجيل الدخول أولاً");

      const postData = {
        title: title,
        description: details,
        category: category,
        governorate: governorate,
        price: parseFloat(wage) || 0,
        contact_phone: phone,
        ...(base64Image ? { image_url: base64Image } : {})
      };

      if (state.currentEditAdId) {
        const res = await fetch(`${BASE_URL}/ads/${state.currentEditAdId}/`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Token ${token}` 
          },
          body: JSON.stringify(postData)
        });
        if (!res.ok) throw new Error("حدث خطأ أثناء تعديل الإعلان.");
        showToast("تم تعديل الإعلان بنجاح", "success");
        state.currentEditAdId = null;
      } else {
        const res = await fetch(`${BASE_URL}/ads/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Token ${token}` 
          },
          body: JSON.stringify(postData)
        });
        if (!res.ok) throw new Error("حدث خطأ أثناء النشر.");
        showToast(t("adPublished"), "success");
      }

      await loadAdsFromAPI();
      
      if (elements.cliqModalOverlay) {
        elements.cliqModalOverlay.classList.remove("open");
      }
      
      const addForm = document.getElementById("addForm");
      if (addForm) addForm.reset();
      
      const imgPreview = document.getElementById("imagePreviewList");
      if (imgPreview) imgPreview.innerHTML = "";
      const receiptPreview = document.getElementById("receiptPreviewList");
      if (receiptPreview) receiptPreview.innerHTML = "";
      const fReceipt = document.getElementById("fReceipt");
      if (fReceipt) fReceipt.value = "";
      
      goToScreen("home");

    } catch (error) {
      const errEl = document.getElementById("cliqModalError") || document.getElementById("addFormError");
      if (errEl) showFormError(errEl, error.message || "حدث خطأ.");
      else showToast(error.message, "error");
      throw error;
    } finally {
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  }

  const addFormEl = document.getElementById("addForm");
  if (addFormEl) {
    addFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const getVal = (id) => document.getElementById(id)?.value.trim() || "";
      const title = getVal("fTitle");
      const governorate = getVal("fGovernorate");
      const category = getVal("fCategory");
      const wage = getVal("fWage");
      const details = getVal("fDetails");
      const phone = getVal("fPhone");
      const errorEl = document.getElementById("addFormError");

      if (!title) { showFormError(errorEl, t("titleRequired")); return; }
      if (category !== "free" && category !== "ads") {
        if (!wage || parseFloat(wage) <= 0) { showFormError(errorEl, t("wageRequired")); return; }
      }
      if (!phone || phone.length !== 10) { showFormError(errorEl, t("invalidPhone")); return; }
      if (!details) { showFormError(errorEl, t("fillAllFields")); return; }
      
      if (state.currentEditAdId) {
        await performSave();
      } else {
        if (elements.cliqModalOverlay) elements.cliqModalOverlay.classList.add("open");
      }
    });
  }

  const confirmCliqBtn = document.getElementById("confirmCliqBtn");
  if (confirmCliqBtn) {
    confirmCliqBtn.addEventListener("click", async () => {
      const receiptInput = document.getElementById("fReceipt");
      const errorEl = document.getElementById("cliqModalError");

      if (!receiptInput || !receiptInput.files || receiptInput.files.length === 0) {
        showFormError(errorEl, t("receiptRequired"));
        return;
      }

      try {
        await performSave();
        closeCliqModal();
      } catch (error) {}
    });
  }

  function updateSettingsPage() {
    if (!state.user) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal("settingsEmail", state.user.email || "");
    setVal("settingsUsername", state.user.username || "");

    const setCheck = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val;
    };

    setCheck("togglePush", state.settings.pushNotifications);
    setCheck("toggleMessages", state.settings.messageNotifications);
    setCheck("toggleMarketing", state.settings.marketingNotifications);

    const govSelect = document.getElementById("settingsGov");
    if (govSelect) govSelect.value = state.settings.preferredGovernorate || "all";

    updateLanguageOptionsUI();
  }

  const saveAccountBtn = document.getElementById("saveAccountBtn");
  if (saveAccountBtn) {
    saveAccountBtn.addEventListener("click", () => {
      const newUsername = document.getElementById("settingsUsername")?.value.trim();
      if (newUsername && newUsername.length >= 3) {
        state.user.username = newUsername;
        localStorage.setItem("dj_user", JSON.stringify(state.user));
        updateDrawerUser();
        showToast(t("settingsSaved"), "success");
      } else {
        showToast(t("usernameMinLength"), "error");
      }
    });
  }

  const bindCheckSetting = (id, key) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", (e) => {
        state.settings[key] = e.target.checked;
        localStorage.setItem("dj_settings", JSON.stringify(state.settings));
      });
    }
  };

  bindCheckSetting("togglePush", "pushNotifications");
  bindCheckSetting("toggleMessages", "messageNotifications");
  bindCheckSetting("toggleMarketing", "marketingNotifications");

  const settingsGov = document.getElementById("settingsGov");
  if (settingsGov) {
    settingsGov.addEventListener("change", (e) => {
      state.settings.preferredGovernorate = e.target.value;
      localStorage.setItem("dj_settings", JSON.stringify(state.settings));
      showToast(t("preferredGovUpdated"), "success");
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  function switchLanguage(lang) {
    state.lang = lang;
    localStorage.setItem("dj_lang", lang);

    const html = document.documentElement;
    if (lang === "ar") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ar");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
    }

    updateAllText();

    const langToggle = document.getElementById("langToggle");
    if (langToggle) langToggle.textContent = lang === "en" ? "عربي" : "EN";

    updateLanguageOptionsUI();
    populateFormSelects();

    const activeScreen = document.querySelector(".screen.active");
    if (activeScreen) {
      const screenName = activeScreen.id.replace("screen-", "");
      goToScreen(screenName);
    }

    showToast(`Language switched to ${lang === "en" ? "English" : "العربية"}`, "success");
  }

  function updateAllText() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (i18n[state.lang] && i18n[state.lang][key]) {
        el.textContent = i18n[state.lang][key];
      }
    });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.placeholder = i18n[state.lang].searchPlaceholder;

    const titleInput = document.getElementById("fTitle");
    if (titleInput) titleInput.placeholder = state.lang === "ar" ? "مثال: مطلوب عامل بناء خبرة في مادبا" : "e.g.: Construction worker needed in Madaba";

    const detailsTextarea = document.getElementById("fDetails");
    if (detailsTextarea) detailsTextarea.placeholder = state.lang === "ar" ? "اكتب وصفك بالتفصيل هنا..." : "Write your description here...";

    const phoneInput = document.getElementById("fPhone");
    if (phoneInput) phoneInput.placeholder = "7X XXX XXXX";

    const usernameInput = document.getElementById("regUsername");
    if (usernameInput) usernameInput.placeholder = state.lang === "ar" ? "abu_mohammad" : "john_doe";

    document.querySelectorAll('input[type="password"]').forEach(input => {
      input.placeholder = "•••••••••";
    });
  }

  function updateLanguageOptionsUI() {
    const enOption = document.getElementById("langOptionEn");
    const arOption = document.getElementById("langOptionAr");

    if (enOption && arOption) {
      if (state.lang === "en") {
        enOption.classList.add("active");
        arOption.classList.remove("active");
      } else {
        enOption.classList.remove("active");
        arOption.classList.add("active");
      }
    }
  }

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      switchLanguage(state.lang === "en" ? "ar" : "en");
    });
  }

  const langOptEn = document.getElementById("langOptionEn");
  const langOptAr = document.getElementById("langOptionAr");
  if (langOptEn) langOptEn.addEventListener("click", () => switchLanguage("en"));
  if (langOptAr) langOptAr.addEventListener("click", () => switchLanguage("ar"));

  let searchTimeout = null;
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.filters.query = e.target.value.trim();
        renderAds();
      }, 300);
    });
  }

  const typeChipRow = document.getElementById("typeChipRow");
  if (typeChipRow) {
    typeChipRow.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip[data-type]");
      if (!chip) return;

      typeChipRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      state.filters.type = chip.dataset.type;
      renderAds();
    });
  }

  const filterBtn = document.getElementById("filterBtn");
  const filterClose = document.getElementById("filterClose");
  const filterApplyBtn = document.getElementById("filterApplyBtn");
  const filterResetBtn = document.getElementById("filterResetBtn");

  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      populateFormSelects();
      if (elements.filterOverlay) elements.filterOverlay.classList.add("open");
    });
  }

  if (filterClose) {
    filterClose.addEventListener("click", () => {
      if (elements.filterOverlay) elements.filterOverlay.classList.remove("open");
    });
  }

  if (elements.filterOverlay) {
    elements.filterOverlay.addEventListener("click", (e) => {
      if (e.target === elements.filterOverlay) elements.filterOverlay.classList.remove("open");
    });
  }

  if (filterApplyBtn) {
    filterApplyBtn.addEventListener("click", () => {
      const activeCatChip = document.querySelector("#filterCategoryChips button.active");
      state.filters.category = activeCatChip ? activeCatChip.dataset.cat : "all";
      const fGov = document.getElementById("filterGovSelect");
      if (fGov) state.filters.governorate = fGov.value;

      if (elements.filterOverlay) elements.filterOverlay.classList.remove("open");
      renderAds();
      updateFilterButtonState();
      showToast(t("filtersApplied"), "success");
    });
  }

  if (filterResetBtn) {
    filterResetBtn.addEventListener("click", () => {
      state.filters = { type: "all", category: "all", governorate: "all", query: "" };

      if (searchInput) searchInput.value = "";
      document.querySelectorAll("#typeChipRow .chip").forEach(c => c.classList.remove("active"));
      const defaultChip = document.querySelector('#typeChipRow .chip[data-type="all"]');
      if (defaultChip) defaultChip.classList.add("active");
      document.querySelectorAll("#filterCategoryChips button").forEach(b => b.classList.remove("active"));
      const fGov = document.getElementById("filterGovSelect");
      if (fGov) fGov.value = "all";

      if (elements.filterOverlay) elements.filterOverlay.classList.remove("open");
      renderAds();
      updateFilterButtonState();
      showToast(t("filtersReset"), "info");
    });
  }

  function updateFilterButtonState() {
    if (!filterBtn) return;
    const hasActiveFilters = 
      state.filters.category !== "all" || 
      state.filters.governorate !== "all" ||
      state.filters.query !== "" ||
      state.filters.type !== "all";

    if (hasActiveFilters) filterBtn.classList.add("has-active");
    else filterBtn.classList.remove("has-active");
  }

  function updateActiveFiltersDisplay() {
    const container = document.getElementById("activeFilters");
    if (!container) return;
    const tags = [];

    if (state.filters.query) {
      tags.push(`
        <span class="filter-tag">
          <i class="fa-solid fa-magnifying-glass"></i>
          ${escapeHtml(state.filters.query)}
          <i class="fa-solid fa-xmark" data-clear-filter="query"></i>
        </span>
      `);
    }

    if (state.filters.type !== "all") {
      const typeName = state.filters.type === "daily" ? t("dailyJob") :
                       state.filters.type === "fulltime" ? t("fullTime") :
                       state.filters.type === "ads" ? t("announcements") :
                       state.filters.type === "services" ? t("services") :
                       state.filters.type === "used" ? t("usedGoods") :
                       state.filters.type === "free" ? t("freebies") : state.filters.type;
      tags.push(`<span class="filter-tag">${typeName}<i class="fa-solid fa-xmark" data-clear-filter="type"></i></span>`);
    }

    if (state.filters.category !== "all") {
      const catName = getCategoryName(state.filters.category, state.lang);
      tags.push(`<span class="filter-tag">${catName}<i class="fa-solid fa-xmark" data-clear-filter="category"></i></span>`);
    }

    if (state.filters.governorate !== "all") {
      const govName = GOV_MAP[state.filters.governorate] ? GOV_MAP[state.filters.governorate][state.lang] : state.filters.governorate;
      tags.push(`
        <span class="filter-tag">
          <i class="fa-solid fa-location-dot"></i>
          ${govName}
          <i class="fa-solid fa-xmark" data-clear-filter="governorate"></i>
        </span>
      `);
    }

    container.innerHTML = tags.join("");

    container.querySelectorAll("[data-clear-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        const filterType = btn.dataset.clearFilter;
        if (filterType === "query") { state.filters.query = ""; if (searchInput) searchInput.value = ""; }
        else if (filterType === "type") { state.filters.type = "all"; }
        else if (filterType === "category") { state.filters.category = "all"; }
        else if (filterType === "governorate") { state.filters.governorate = "all"; }
        renderAds();
        updateFilterButtonState();
      });
    });
  }

  let toastTimer = null;
  function showToast(message, kind = "info") {
    clearTimeout(toastTimer);
    const toastEl = elements.toast;
    if (!toastEl) return;

    const icons = {
      success: "fa-circle-check",
      error: "fa-circle-exclamation",
      info: "fa-circle-info",
      warning: "fa-triangle-exclamation"
    };

    toastEl.className = `toast toast-${kind}`;
    toastEl.innerHTML = `<i class="fa-solid ${icons[kind] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    toastEl.classList.add("show");
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  function t(key) {
    return i18n[state.lang][key] || key;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function formatRelative(date) {
    const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (mins < 60) return `${mins} ${t("minsAgo")}`;
    else if (mins < 1440) return `${Math.round(mins / 60)} ${t("hoursAgo")}`;
    else return `${Math.round(mins / 1440)} ${t("daysAgo")}`;
  }

  function showFormError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
  }

  function handleImagePreview(inputId, btnId, previewListId) {
    const fileInput = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    const previewList = document.getElementById(previewListId);

    if (btn && fileInput) {
      btn.addEventListener("click", () => fileInput.click());
    }

    if (fileInput && previewList) {
      fileInput.addEventListener("change", () => {
        previewList.innerHTML = "";
        const files = Array.from(fileInput.files);
        files.forEach((file) => {
          if (!file.type.startsWith("image/")) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const item = document.createElement("div");
            item.className = "image-preview-item";
            item.innerHTML = `
              <img src="${e.target.result}" alt="Preview">
              <span class="image-preview-remove"><i class="fa-solid fa-xmark"></i></span>
            `;
            item.querySelector(".image-preview-remove").addEventListener("click", (ev) => {
              ev.stopPropagation();
              item.remove();
            });
            previewList.appendChild(item);
          };
          reader.readAsDataURL(file);
        });
      });
    }
  }

  function init() {
    const savedUser = localStorage.getItem("dj_user");
    if (savedUser) {
      try {
        state.user = JSON.parse(savedUser);
        state.isAuthenticated = true;
      } catch (e) {
        localStorage.removeItem("dj_user");
      }
    }

    const savedSettings = localStorage.getItem("dj_settings");
    if (savedSettings) {
      try {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
      } catch (e) {}
    }

    const html = document.documentElement;
    if (state.lang === "ar") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ar");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
    }

    const langToggleBtn = document.getElementById("langToggle");
    if (langToggleBtn) langToggleBtn.textContent = state.lang === "en" ? "عربي" : "EN";

    populateFormSelects();
    handleImagePreview("fImages", "imageUploadBtn", "imagePreviewList");
    handleImagePreview("fReceipt", "receiptUploadBtn", "receiptPreviewList");

    updateAllText();
    updateDrawerUser();
    updateNotificationDot();

    goToScreen("home");

    loadAdsFromAPI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function setupEnterToNext(containerId, submitBtnId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const inputs = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([disabled])'));

    inputs.forEach((input, index) => {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
          } else {
            const submitBtn = document.getElementById(submitBtnId);
            if (submitBtn) submitBtn.click();
          }
        }
      });
    });
  }

  setupEnterToNext('authStepLogin', 'loginSubmitBtn');
  setupEnterToNext('authStepRegister', 'registerSubmitBtn');
  setupEnterToNext('authStepForgot', 'forgotSubmitBtn');
  setupEnterToNext('authStepReset', 'resetSubmitBtn');

  document.addEventListener('click', function (e) {
    const toggleBtn = e.target.closest('.toggle-password');
    if (!toggleBtn) return;

    const wrapper = toggleBtn.closest('.password-wrapper');
    if (!wrapper) return;
    
    const passInput = wrapper.querySelector('input');
    if (!passInput) return;

    const isPassword = passInput.getAttribute('type') === 'password';
    passInput.setAttribute('type', isPassword ? 'text' : 'password');

    toggleBtn.classList.toggle('fa-eye-slash');
    toggleBtn.classList.toggle('fa-eye');
    passInput.focus();
  });

  // 1. زر تأكيد البريد بعد التسجيل (OTP)
  const verifySubmitBtn = document.getElementById("verifySubmitBtn");
  if(verifySubmitBtn) {
    verifySubmitBtn.addEventListener("click", async () => {
      const otp = document.getElementById("verifyOtp").value.trim();
      const errorEl = document.getElementById("verifyError");
      
      if(otp.length !== 6) { showFormError(errorEl, "الرمز يجب أن يكون 6 أرقام"); return; }
      
      const originalText = verifySubmitBtn.innerHTML;
      try {
        verifySubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        verifySubmitBtn.disabled = true;
        
        await Api.verifyEmail(state.tempEmail, otp);
        
        const result = await Api.login(state.tempEmail, state.tempPassword);
        state.isAuthenticated = true;
        state.user = result.user;
        localStorage.setItem("dj_user", JSON.stringify(state.user));
        localStorage.setItem("dj_token", result.token);
        
        closeAuth();
        updateDrawerUser();
        showToast("تم تفعيل حسابك بنجاح!", "success");
        
      } catch (error) {
        showFormError(errorEl, error.message);
      } finally {
        verifySubmitBtn.innerHTML = originalText;
        verifySubmitBtn.disabled = false;
      }
    });
  }

  // 2. زر نسيت كلمة المرور
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  if(forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthStep('authStepForgot');
    });
  }

  // --- DELETE AD ---
  const deleteAdBtn = document.getElementById("deleteAdBtn");
  if (deleteAdBtn) {
    deleteAdBtn.addEventListener("click", async () => {
      if (!confirm(t("confirmDeleteAd"))) return;
      try {
        const token = localStorage.getItem("dj_token");
        await Api.deleteAd(state.currentAdId, token);
        ads = ads.filter(a => a.id !== state.currentAdId);
        renderAds();
        showToast("تم حذف الإعلان بنجاح!", "success");
        goToScreen("home");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  // --- DELETE ACCOUNT ---
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      if (!confirm(t("confirmDeleteAccount"))) return;
      try {
        const token = localStorage.getItem("dj_token");
        await Api.deleteAccount(state.user.id, token);
        
        localStorage.removeItem("dj_user");
        localStorage.removeItem("dj_token");
        localStorage.removeItem("dj_favorites");
        
        state.isAuthenticated = false;
        state.user = null;
        updateDrawerUser();
        
        showToast("تم حذف حسابك بنجاح.", "success");
        goToScreen("home");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  const backToLoginBtn = document.getElementById("backToLoginBtn");
  if(backToLoginBtn) {
    backToLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showLoginStep();
    });
  }

  // 3. زر إرسال الإيميل لطلب استعادة كلمة المرور
  const forgotSubmitBtn = document.getElementById("forgotSubmitBtn");
  if(forgotSubmitBtn) {
    forgotSubmitBtn.addEventListener("click", async () => {
      const email = document.getElementById("forgotEmail").value.trim();
      const errorEl = document.getElementById("forgotError");
      
      if(!isValidEmail(email)) { showFormError(errorEl, "بريد إلكتروني غير صالح"); return; }
      
      const originalText = forgotSubmitBtn.innerHTML;
      try {
        forgotSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        forgotSubmitBtn.disabled = true;
        
        await Api.requestPasswordReset(email);
        
        state.resetUserEmail = email; // تخزين الإيميل للمرحلة القادمة
        showToast("تم إرسال رمز التحقق إلى بريدك!", "success");
        
        // الانتقال لشاشة إدخال الرمز
        showAuthStep('authStepReset');
        
      } catch (error) {
        showFormError(errorEl, error.message);
      } finally {
        forgotSubmitBtn.innerHTML = originalText;
        forgotSubmitBtn.disabled = false;
      }
    });
  }

  // 4. زر حفظ كلمة المرور الجديدة باستخدام OTP
  const resetSubmitBtn = document.getElementById("resetSubmitBtn");
  if(resetSubmitBtn) {
    resetSubmitBtn.addEventListener("click", async () => {
      const otp = document.getElementById("resetOtp").value.trim();
      const newPass = document.getElementById("resetNewPassword").value;
      const errorEl = document.getElementById("resetError");
      
      if(otp.length !== 6) { showFormError(errorEl, "الرمز يجب أن يكون 6 أرقام"); return; }
      if(newPass.length < 6) { showFormError(errorEl, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
      
      const originalText = resetSubmitBtn.innerHTML;
      try {
        resetSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        resetSubmitBtn.disabled = true;
        
        await Api.confirmPasswordReset(state.resetUserEmail, otp, newPass);
        
        showToast("تم تغيير كلمة المرور بنجاح!", "success");
        
        // مسح الحقول والعودة لتسجيل الدخول
        document.getElementById("resetOtp").value = "";
        document.getElementById("resetNewPassword").value = "";
        document.getElementById("forgotEmail").value = "";
        state.resetUserEmail = "";
        
        showLoginStep();
        
      } catch (error) {
        showFormError(errorEl, error.message);
      } finally {
        resetSubmitBtn.innerHTML = originalText;
        resetSubmitBtn.disabled = false;
      }
    });
  }

})();