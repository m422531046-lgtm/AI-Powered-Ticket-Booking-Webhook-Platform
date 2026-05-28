  const WEBHOOK_URL = 'PASTE_YOUR_WEBHOOK_URL_HERE';

    const loader = document.getElementById('loader');
    const cursorGlow = document.getElementById('cursorGlow');
    const header = document.getElementById('header');
    const menuBtn = document.getElementById('menuBtn');
    const links = document.getElementById('links');
    const navLinks = document.querySelectorAll('.nav-link');
    const backTop = document.getElementById('backTop');
    const revealElements = document.querySelectorAll('.reveal');
    const counters = document.querySelectorAll('[data-count]');
    const typingText = document.getElementById('typingText');
    const tiltCard = document.getElementById('tiltCard');

    const bookingForm = document.getElementById('bookingForm');
    const ticketType = document.getElementById('ticketType');
    const quantity = document.getElementById('quantity');
    const summaryType = document.getElementById('summaryType');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryQty = document.getElementById('summaryQty');
    const summaryTotal = document.getElementById('summaryTotal');
    const availableSeatsElement = document.getElementById('availableSeats');
    const successPanel = document.getElementById('successPanel');
    const qrImage = document.getElementById('qrImage');
    const successBookingId = document.getElementById('successBookingId');
    const formMessage = document.getElementById('formMessage');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');
    const toast = document.getElementById('toast');

    let availableSeats = 120;
    let countersStarted = false;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const typingWords = ['Telegram Bot', 'Google Sheets', 'Webhook URL', 'QR Ticket System'];

    window.addEventListener('load', () => {
      if (loader) setTimeout(() => loader.classList.add('hide'), 650);

      const dateInput = document.getElementById('date');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
      }

      updateSummary();
      handleScroll();
      typeLoop();
    });

    if (cursorGlow) {
      document.addEventListener('mousemove', event => {
        cursorGlow.style.left = event.clientX + 'px';
        cursorGlow.style.top = event.clientY + 'px';
      });
    }

    if (menuBtn && links) {
      menuBtn.addEventListener('click', () => {
        links.classList.toggle('open');
        menuBtn.textContent = links.classList.contains('open') ? '×' : '☰';
      });

      links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          links.classList.remove('open');
          menuBtn.textContent = '☰';
        });
      });
    }

    function typeLoop() {
      if (!typingText) return;
      const word = typingWords[wordIndex];

      if (!deleting) {
        typingText.textContent = word.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === word.length) {
          deleting = true;
          setTimeout(typeLoop, 1100);
          return;
        }
      } else {
        typingText.textContent = word.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % typingWords.length;
        }
      }

      setTimeout(typeLoop, deleting ? 45 : 85);
    }

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1800);
    }

    function getSelectedTicket() {
      if (!ticketType) return { type: 'Regular', price: 25 };
      const selected = ticketType.options[ticketType.selectedIndex];
      return { type: selected.value, price: Number(selected.dataset.price || 25) };
    }

    function updateSummary() {
      if (!summaryType || !summaryPrice || !summaryQty || !summaryTotal) return;
      const ticket = getSelectedTicket();
      const qty = Number(quantity?.value || 1);
      const total = ticket.price * qty;
      summaryType.textContent = ticket.type;
      summaryPrice.textContent = `$${ticket.price}`;
      summaryQty.textContent = qty;
      summaryTotal.textContent = `$${total}`;
    }

    if (ticketType) {
      ticketType.addEventListener('change', () => {
        updateSummary();
        showToast('تم تغيير نوع التذكرة');
      });
    }

    if (quantity) {
      quantity.addEventListener('input', () => {
        if (Number(quantity.value) < 1) quantity.value = 1;
        if (Number(quantity.value) > 10) quantity.value = 10;
        updateSummary();
      });
    }

    function createBookingId() {
      const random = Math.floor(1000 + Math.random() * 9000);
      return `TK-${Date.now().toString().slice(-5)}-${random}`;
    }

    function generateSeatNumber(ticketTypeName) {
      const prefix = ticketTypeName === 'VIP' ? 'VIP' : ticketTypeName === 'Premium' ? 'PRM' : 'REG';
      const number = Math.floor(100 + Math.random() * 899);
      return `${prefix}-${number}`;
    }

    function generateQRText(bookingId, name, ticketTypeName, seatNumber) {
      return `BOOKING:${bookingId}|NAME:${name}|TICKET:${ticketTypeName}|SEAT:${seatNumber}`;
    }

    function generateQRCodeURL(qrText) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrText)}`;
    }

    function updateLiveSeats(qty) {
      availableSeats = Math.max(0, availableSeats - qty);
      if (availableSeatsElement) availableSeatsElement.textContent = availableSeats;
    }

    async function sendToWebhook(payload) {
      if (!WEBHOOK_URL || WEBHOOK_URL === 'PASTE_YOUR_WEBHOOK_URL_HERE') {
        console.warn('Demo mode. Webhook URL is not configured:', payload);
        return { demo: true, success: true };
      }

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Webhook request failed');
      return response.json().catch(() => ({ success: true }));
    }

    if (bookingForm) {
      bookingForm.addEventListener('submit', async event => {
        event.preventDefault();

        formMessage?.classList.remove('show');
        errorMessage?.classList.remove('show');
        successPanel?.classList.remove('show');

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'جاري إرسال الحجز...';
        }

        const ticket = getSelectedTicket();
        const qty = Number(quantity?.value || 1);
        const total = ticket.price * qty;
        const bookingId = createBookingId();
        const formData = Object.fromEntries(new FormData(bookingForm).entries());
        const seatNumber = generateSeatNumber(ticket.type);
        const qrText = generateQRText(bookingId, formData.name, ticket.type, seatNumber);
        const qrURL = generateQRCodeURL(qrText);

        const payload = {
          bookingId,
          customerName: formData.name,
          phone: formData.phone,
          ticketType: ticket.type,
          ticketPrice: ticket.price,
          quantity: qty,
          total,
          bookingDate: formData.date,
          paymentMethod: formData.payment,
          notes: formData.notes || 'No notes',
          seatNumber,
          qrText,
          qrURL,
          source: 'Tickora Booking Website',
          createdAt: new Date().toISOString(),
          botMessage: `🎟 New Ticket Booking\n\n🆔 Booking ID: ${bookingId}\n👤 Name: ${formData.name}\n📱 Phone: ${formData.phone}\n🎫 Ticket: ${ticket.type}\n💺 Seat: ${seatNumber}\n🔢 Quantity: ${qty}\n💵 Total: $${total}\n📅 Date: ${formData.date}\n💳 Payment: ${formData.payment}\n📝 Notes: ${formData.notes || 'No notes'}\n🔐 QR: ${qrText}`
        };

        try {
          await sendToWebhook(payload);
          updateLiveSeats(qty);

          if (qrImage) qrImage.src = qrURL;
          if (successBookingId) successBookingId.textContent = `Booking ID: ${bookingId} | Seat: ${seatNumber}`;
          successPanel?.classList.add('show');

          if (formMessage) {
            formMessage.textContent = `تم إرسال الحجز بنجاح. رقم الحجز: ${bookingId}`;
            formMessage.classList.add('show');
          }

          showToast('تم إرسال الحجز بنجاح');
          bookingForm.reset();

          const dateInput = document.getElementById('date');
          if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
          }
          updateSummary();
        } catch (error) {
          console.error(error);
          if (errorMessage) {
            errorMessage.textContent = 'تعذر الإرسال. تأكد من رابط الويب هوك أو جرّب مرة أخرى.';
            errorMessage.classList.add('show');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال الحجز';
          }
        }
      });
    }

    function revealOnScroll() {
      revealElements.forEach(element => {
        const top = element.getBoundingClientRect().top;
        if (top < window.innerHeight - 90) element.classList.add('active');
      });
    }

    function animateCounters() {
      if (countersStarted || counters.length === 0) return;
      if (counters[0].getBoundingClientRect().top > window.innerHeight - 120) return;
      countersStarted = true;

      counters.forEach(counter => {
        const target = Number(counter.dataset.count);
        let current = 0;
        const increment = target / 70;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current);
          }
        }, 20);
      });
    }

    function setActiveNav() {
      const sections = document.querySelectorAll('section[id]');
      let current = 'home';
      sections.forEach(section => {
        const top = section.offsetTop - 120;
        if (window.scrollY >= top) current = section.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    }

    function handleScroll() {
      header?.classList.toggle('scrolled', window.scrollY > 40);
      backTop?.classList.toggle('show', window.scrollY > 500);
      revealOnScroll();
      animateCounters();
      setActiveNav();
    }

    window.addEventListener('scroll', handleScroll);

    if (backTop) {
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (tiltCard) {
      tiltCard.addEventListener('mousemove', event => {
        const rect = tiltCard.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 10;
        const rotateX = ((y / rect.height) - 0.5) * -10;
        tiltCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      tiltCard.addEventListener('mouseleave', () => {
        tiltCard.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
      });
    }