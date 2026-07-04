// Target Date for the Wedding (September 27, 2026, at 8:00 PM)
const WEDDING_DATE = new Date("2026-09-27T20:00:00").getTime();

document.addEventListener("DOMContentLoaded", () => {
    initAudio();
    initScratchCard();
    initCountdown();
    initScrollAnimations();
});

/* ==========================================================================
   1. Audio Player Controller
   ========================================================================== */
function initAudio() {
    const audio = document.getElementById("bg-audio");
    const toggleBtn = document.getElementById("audio-toggle");
    if (!audio || !toggleBtn) return;

    const iconMuted = document.getElementById("audio-icon-muted");
    const iconPlaying = document.getElementById("audio-icon-playing");
    let isUserInteracted = false;

    // Set initial volume lower for subtle ambient background
    audio.volume = 0.4;

    function playAudio() {
        audio.play().then(() => {
            toggleBtn.classList.add("playing");
            iconMuted.style.display = "none";
            iconPlaying.style.display = "block";
        }).catch(err => {
            console.log("Autoplay blocked or audio load error: ", err);
        });
    }

    function pauseAudio() {
        audio.pause();
        toggleBtn.classList.remove("playing");
        iconMuted.style.display = "block";
        iconPlaying.style.display = "none";
    }

    // Toggle on button click
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (audio.paused) {
            playAudio();
        } else {
            pauseAudio();
        }
    });

    // Attempt to start music on first user interaction with page
    const autoPlayOnInteract = (e) => {
        // If user interacted with the toggle button itself, let the button click listener handle it
        if (e && e.target && e.target.closest("#audio-toggle")) return;

        if (!isUserInteracted) {
            isUserInteracted = true;
            playAudio();
            // Remove listeners once interacted
            document.removeEventListener("click", autoPlayOnInteract);
            document.removeEventListener("touchstart", autoPlayOnInteract);
            document.removeEventListener("scroll", autoPlayOnInteract);
        }
    };

    document.addEventListener("click", autoPlayOnInteract);
    document.addEventListener("touchstart", autoPlayOnInteract, { passive: true });
    document.addEventListener("scroll", autoPlayOnInteract, { passive: true });
}

/* ==========================================================================
   2. HTML5 Canvas Scratch-to-Reveal
   ========================================================================== */
function initScratchCard() {
    const canvas = document.getElementById("scratch-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let isDrawing = false;
    let isRevealed = false;
    const scratchRadius = 24; // Brush width

    // Base dimensions matching CSS box
    const width = canvas.width;
    const height = canvas.height;

    // Load premium gold foil texture image onto scratch canvas
    const img = new Image();
    img.src = "assets/gold_foil.png";
    img.onload = () => {
        // Draw gold foil texture
        ctx.drawImage(img, 0, 0, width, height);
        
        // Add overlay text prompting the user to scratch
        ctx.font = "italic 600 24px 'Playfair Display', serif";
        ctx.fillStyle = "#0a1f16"; // Contrast text color
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Scratch to Reveal", width / 2, height / 2 - 10);

        ctx.font = "400 11px 'Montserrat', sans-serif";
        ctx.fillStyle = "rgba(10, 31, 22, 0.7)";
        ctx.fillText("TAP & SCRATCH HERE", width / 2, height / 2 + 25);
    };

    // Fallback if image fails to load
    img.onerror = () => {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#d4af37");
        grad.addColorStop(0.5, "#f3e5ab");
        grad.addColorStop(1, "#aa7c11");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.font = "italic 600 24px 'Playfair Display', serif";
        ctx.fillStyle = "#0a1f16";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Scratch to Reveal", width / 2, height / 2);
    };

    // Desktop Mouse Events
    canvas.addEventListener("mousedown", dragStart);
    canvas.addEventListener("mousemove", dragMove);
    canvas.addEventListener("mouseup", dragEnd);
    canvas.addEventListener("mouseleave", dragEnd);

    // Mobile Touch Events
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        dragStart(e.touches[0]);
    });
    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        dragMove(e.touches[0]);
    });
    canvas.addEventListener("touchend", dragEnd);

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        // Handle coordinates appropriately scaled for canvas internal resolution
        return {
            x: ((e.clientX - rect.left) / rect.width) * width,
            y: ((e.clientY - rect.top) / rect.height) * height
        };
    }

    function dragStart(e) {
        if (isRevealed) return;
        isDrawing = true;
        scratch(e);
    }

    function dragMove(e) {
        if (!isDrawing || isRevealed) return;
        scratch(e);
    }

    function dragEnd() {
        isDrawing = false;
        if (!isRevealed) {
            checkScratchPercentage();
        }
    }

    function scratch(e) {
        const coords = getCoords(e);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, scratchRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Check if the user has scratched enough of the card
    function checkScratchPercentage() {
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        let clearedCount = 0;

        // Loop through alpha channel (every 4th byte)
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                clearedCount++;
            }
        }

        const percentage = (clearedCount / (pixels.length / 4)) * 100;

        // Auto-reveal if more than 40% is scratched off
        if (percentage > 40) {
            revealCard();
        }
    }

    function revealCard() {
        isRevealed = true;
        canvas.style.opacity = 0;
        setTimeout(() => {
            canvas.style.display = "none";
            document.getElementById("scratch-hint-text").innerHTML = "Revealed! Save the date in your calendar ✨";
            document.getElementById("scratch-hint-text").style.color = "var(--gold-primary)";
        }, 500);
    }
}

/* ==========================================================================
   3. Countdown Timer Clock
   ========================================================================== */
function initCountdown() {
    const daysVal = document.getElementById("days");
    const hoursVal = document.getElementById("hours");
    if (!daysVal || !hoursVal) return;

    const minutesVal = document.getElementById("minutes");
    const secondsVal = document.getElementById("seconds");
    const timerTitle = document.querySelector("#countdown .section-subtitle");

    function update() {
        const now = new Date().getTime();
        const distance = WEDDING_DATE - now;

        if (distance < 0) {
            daysVal.innerText = "00";
            hoursVal.innerText = "00";
            minutesVal.innerText = "00";
            secondsVal.innerText = "00";
            if (timerTitle) {
                timerTitle.innerText = "The Wedding Celebration is happening now!";
                timerTitle.style.color = "var(--gold-primary)";
            }
            clearInterval(intervalId);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Format leading zeros
        daysVal.innerText = days < 10 ? "0" + days : days;
        hoursVal.innerText = hours < 10 ? "0" + hours : hours;
        minutesVal.innerText = minutes < 10 ? "0" + minutes : minutes;
        secondsVal.innerText = seconds < 10 ? "0" + seconds : seconds;
    }

    update();
    const intervalId = setInterval(update, 1000);
}

/* ==========================================================================
   4. Scroll and Reveal Transitions (Intersection Observer)
   ========================================================================== */
function initScrollAnimations() {
    const fadeSections = document.querySelectorAll(".fade-in-section");
    if (!fadeSections || fadeSections.length === 0) return;
    
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                
                // If it is the timeline section, animate timeline nodes incrementally
                if (entry.target.id === "timeline") {
                    animateTimelineItems();
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeSections.forEach(section => {
        sectionObserver.observe(section);
    });
}

function animateTimelineItems() {
    const items = document.querySelectorAll(".timeline-item");
    items.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add("animate-in");
        }, index * 200); // 200ms sequential stagger delay
    });
}

/* ==========================================================================
   5. Form RSVP Handler & Ticket Generator
   ========================================================================== */
function handleRSVPSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById("guest-name").value.trim();
    const relation = document.getElementById("guest-relation").value;
    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const guestCount = document.getElementById("guest-count").value;
    const message = document.getElementById("guest-message").value.trim();

    const rsvpData = {
        name,
        relation,
        attendance,
        guestCount: attendance === "attending" ? parseInt(guestCount, 10) : 0,
        message,
        dateSubmitted: new Date().toISOString()
    };

    // Save RSVP locally in browser database
    let existingRSVPs = JSON.parse(localStorage.getItem("wedding_rsvps")) || [];
    // Prevent duplicate entries by name
    existingRSVPs = existingRSVPs.filter(r => r.name.toLowerCase() !== name.toLowerCase());
    existingRSVPs.push(rsvpData);
    localStorage.setItem("wedding_rsvps", JSON.stringify(existingRSVPs));

    console.log("New RSVP Submitted: ", rsvpData);

    const formContainer = document.getElementById("rsvp-form-container");
    const successState = document.getElementById("rsvp-success-state");
    const successMsg = document.getElementById("rsvp-success-message");
    const ticketContainer = document.getElementById("ticket-container");

    formContainer.style.display = "none";
    successState.classList.add("active");

    if (attendance === "attending") {
        successMsg.innerText = `Thank you, ${name}! We have registered ${rsvpData.guestCount} guest(s) from the '${relation}' circle. Looking forward to seeing you at Love Palace, Mustang City, Love Country!`;
        
        // Generate QR code ticket pass
        const qrContainer = document.getElementById("rsvp-qrcode");
        qrContainer.innerHTML = ""; // Clear old QR if any
        
        // Create QR containing clean data layout (Format: Name|Relation|GuestCount)
        const qrText = `${name}|${relation}|${rsvpData.guestCount}`;
        
        try {
            new QRCode(qrContainer, {
                text: qrText,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
            
            document.getElementById("ticket-guest-name").innerText = name;
            ticketContainer.style.display = "block";
        } catch (err) {
            console.error("QR Code generation failed: ", err);
            ticketContainer.style.display = "none";
        }
    } else {
        successMsg.innerText = `Thank you for letting us know, ${name}. You will be missed, but we appreciate your warm wishes!`;
        ticketContainer.style.display = "none";
    }
}

function toggleGuestCount(isAttending) {
    const guestCountGroup = document.getElementById("guest-count-group");
    if (isAttending) {
        guestCountGroup.style.display = "block";
    } else {
        guestCountGroup.style.display = "none";
    }
}

/* ==========================================================================
   6. Organizer Portal & QR Scanner Controller
   ========================================================================== */
let html5QrCode = null;
let isScannerRunning = false;

window.toggleAdminPortal = function() {
    const portal = document.getElementById("admin-portal");
    const isOpening = !portal.classList.contains("active");
    
    if (isOpening) {
        portal.classList.add("active");
        // Reset auth screen state
        document.getElementById("admin-auth-screen").style.display = "block";
        document.getElementById("admin-scanner-screen").style.display = "none";
        document.getElementById("admin-passcode").value = "";
        document.getElementById("admin-auth-error").style.display = "none";
    } else {
        portal.classList.remove("active");
        if (isScannerRunning) {
            stopScanner();
        }
    }
};

window.authenticateAdmin = function() {
    const passcode = document.getElementById("admin-passcode").value;
    const authError = document.getElementById("admin-auth-error");
    
    // Easy default passcode for organizer demonstration
    if (passcode === "1234") {
        authError.style.display = "none";
        document.getElementById("admin-auth-screen").style.display = "none";
        document.getElementById("admin-scanner-screen").style.display = "block";
        updateCheckedInCount();
    } else {
        authError.style.display = "block";
    }
};

function updateCheckedInCount() {
    const checkedIn = JSON.parse(localStorage.getItem("checked_in_guests")) || [];
    document.getElementById("checked-in-count").innerText = checkedIn.length;
}

window.toggleCamera = function() {
    if (isScannerRunning) {
        stopScanner();
    } else {
        startScanner();
    }
};

function startScanner() {
    const statusBox = document.getElementById("scanner-status-box");
    const btnToggle = document.getElementById("btn-toggle-camera");

    // Initialize html5QrCode scanner helper if not created
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    const config = { 
        fps: 10, 
        qrbox: { width: 200, height: 200 } 
    };

    updateStatus("Initializing camera...", "normal");

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess, 
        onScanError
    ).then(() => {
        isScannerRunning = true;
        btnToggle.innerText = "Stop Camera";
        btnToggle.style.background = "#f44336";
        btnToggle.style.color = "#ffffff";
        btnToggle.style.borderColor = "#f44336";
        updateStatus("Scanning for guest QR tickets...", "normal");
    }).catch(err => {
        console.error("Camera access error: ", err);
        updateStatus("Camera access denied or not found.", "error");
    });
}

function stopScanner() {
    const btnToggle = document.getElementById("btn-toggle-camera");
    
    if (html5QrCode && isScannerRunning) {
        html5QrCode.stop().then(() => {
            isScannerRunning = false;
            btnToggle.innerText = "Start Camera";
            btnToggle.style.background = "var(--bg-primary)";
            btnToggle.style.color = "var(--gold-primary)";
            btnToggle.style.borderColor = "var(--gold-primary)";
            updateStatus("Camera stopped.", "normal");
        }).catch(err => {
            console.error("Failed to stop scanner: ", err);
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    console.log("QR Code Decoded: ", decodedText);
    
    // Parse format: Name|Relation|GuestCount
    const parts = decodedText.split("|");
    if (parts.length === 3) {
        const guestName = parts[0];
        const relation = parts[1];
        const guestCount = parts[2];
        
        let checkedInList = JSON.parse(localStorage.getItem("checked_in_guests")) || [];
        const isAlreadyCheckedIn = checkedInList.some(g => g.name.toLowerCase() === guestName.toLowerCase());
        
        if (isAlreadyCheckedIn) {
            playScanBeep(false); // Fail buzzer
            updateStatus(`Already Checked In:<br><strong>${guestName}</strong>`, "error");
        } else {
            // Success check-in registration
            checkedInList.push({
                name: guestName,
                relation: relation,
                guests: guestCount,
                checkinTime: new Date().toISOString()
            });
            localStorage.setItem("checked_in_guests", JSON.stringify(checkedInList));
            
            playScanBeep(true); // Success beep
            updateCheckedInCount();
            updateStatus(`Checked In Successful:<br><strong>${guestName}</strong> (+${guestCount - 1} guests)`, "success");
            
            // Stagger reset scanner status box after a short delay
            setTimeout(() => {
                if (isScannerRunning) {
                    updateStatus("Scanning for guest QR tickets...", "normal");
                }
            }, 3500);
        }
    } else {
        // Invalid non-app QR code scanned
        playScanBeep(false);
        updateStatus("Invalid code. Please scan a valid entry pass.", "error");
    }
}

function onScanError(errorMessage) {
    // Silent - triggers continuously while frames have no QR code
}

function updateStatus(message, type) {
    const statusBox = document.getElementById("scanner-status-box");
    statusBox.innerHTML = message;
    
    statusBox.className = "scanner-status"; // Clear types
    if (type === "success") {
        statusBox.classList.add("scan-success");
    } else if (type === "error") {
        statusBox.classList.add("scan-error");
    }
}

// Synthesise audio beep using Web Audio API (Zero external network dependencies)
function playScanBeep(isSuccess) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (isSuccess) {
            // High pitch short pleasant beep
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.12);
        } else {
            // Low pitch longer buzz
            oscillator.type = "sawtooth";
            oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.28);
        }
    } catch (e) {
        console.warn("Audio synthesis not allowed/supported yet by browser policies.");
    }
}

/* ==========================================================================
   7. Organizer Tabs & Guest List Renderer
   ========================================================================== */
window.switchAdminTab = function(tabName) {
    const btnScanner = document.getElementById("tab-btn-scanner");
    const btnGuests = document.getElementById("tab-btn-guests");
    const contentScanner = document.getElementById("tab-content-scanner");
    const contentGuests = document.getElementById("tab-content-guests");

    if (tabName === "scanner") {
        btnScanner.classList.add("active");
        btnGuests.classList.remove("active");
        contentScanner.style.display = "block";
        contentGuests.style.display = "none";
    } else {
        btnScanner.classList.remove("active");
        btnGuests.classList.add("active");
        contentScanner.style.display = "none";
        contentGuests.style.display = "block";
        renderGuestList();
    }
};

function renderGuestList() {
    const tbody = document.getElementById("guest-list-tbody");
    if (!tbody) return;

    const rsvps = JSON.parse(localStorage.getItem("wedding_rsvps")) || [];
    const checkedIn = JSON.parse(localStorage.getItem("checked_in_guests")) || [];
    
    tbody.innerHTML = ""; // Clear table

    if (rsvps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-gray); padding: 25px 0;">No guests registered yet.</td></tr>`;
        return;
    }

    // Sort RSVPs: Attending guests first, then name alphabetical
    const sortedRSVPs = rsvps.sort((a, b) => {
        if (a.attendance === b.attendance) {
            return a.name.localeCompare(b.name);
        }
        return a.attendance === "attending" ? -1 : 1;
    });

    sortedRSVPs.forEach(guest => {
        const tr = document.createElement("tr");
        
        // Arrived status check
        const isArrived = checkedIn.some(c => c.name.toLowerCase() === guest.name.toLowerCase());
        const arrivedBadge = isArrived 
            ? `<span class="status-badge arrived">Yes</span>` 
            : `<span class="status-badge pending">No</span>`;

        // Ticket action button
        let actionBtn = "";
        if (guest.attendance === "attending") {
            const escapedName = encodeURIComponent(guest.name);
            const escapedRelation = encodeURIComponent(guest.relation);
            actionBtn = `<button class="btn-view-pass" onclick="openTicketPreview('${escapedName}', '${escapedRelation}', ${guest.guestCount})">View Pass</button>`;
        } else {
            actionBtn = `<span style="color: #e57373; font-size: 0.75rem; text-transform: uppercase;">Declined</span>`;
        }

        tr.innerHTML = `
            <td style="padding: 12px 5px; font-weight: 500;">
                <div>${guest.name}</div>
                <div style="font-size: 0.7rem; color: var(--text-gray);">${guest.relation}</div>
            </td>
            <td style="padding: 12px 5px; text-align: center;">${guest.attendance === "attending" ? guest.guestCount : "0"}</td>
            <td style="padding: 12px 5px; text-align: center;">${arrivedBadge}</td>
            <td style="padding: 12px 5px; text-align: right;">${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.openTicketPreview = function(escapedName, escapedRelation, guestCount) {
    const name = decodeURIComponent(escapedName);
    const relation = decodeURIComponent(escapedRelation);
    const modal = document.getElementById("ticket-preview-modal");
    const qrContainer = document.getElementById("admin-rsvp-qrcode");
    const guestLabel = document.getElementById("admin-ticket-guest-name");

    qrContainer.innerHTML = ""; // Clear old QR Code
    guestLabel.innerText = name;

    const qrText = `${name}|${relation}|${guestCount}`;

    try {
        new QRCode(qrContainer, {
            text: qrText,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
        modal.style.display = "flex";
    } catch (err) {
        console.error("Failed to generate ticket preview QR: ", err);
    }
};

window.closeTicketPreview = function() {
    document.getElementById("ticket-preview-modal").style.display = "none";
};

window.printTicket = function() {
    window.print();
};

/* ==========================================================================
   8. Helper Utilities
   ========================================================================== */
window.scrollToSection = function(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth" });
    }
};
