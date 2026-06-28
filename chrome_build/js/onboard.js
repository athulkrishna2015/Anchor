document.addEventListener("DOMContentLoaded", function() {
    let currentStep = 1;
    let selectedMode = "allowlist";
    let domains = [];

    // Step 1 to Step 2
    document.getElementById("btn-next-1").addEventListener("click", function() {
        document.getElementById("step-1").classList.remove("active");
        document.getElementById("step-2").classList.add("active");
        currentStep = 2;
        updateUI();
    });

    // Mode Toggle
    document.getElementById("mode-blocklist").addEventListener("click", function() {
        selectedMode = "blocklist";
        document.getElementById("mode-blocklist").classList.add("selected");
        document.getElementById("mode-allowlist").classList.remove("selected");
        updateUI();
    });

    document.getElementById("mode-allowlist").addEventListener("click", function() {
        selectedMode = "allowlist";
        document.getElementById("mode-allowlist").classList.add("selected");
        document.getElementById("mode-blocklist").classList.remove("selected");
        updateUI();
    });

    // Input handlers
    const domainInput = document.getElementById("domain-input");
    const addBtn = document.getElementById("btn-add-domain");

    function addDomain(domain) {
        domain = domain.trim().toLowerCase();
        if (!domain) return;
        // Strip protocols and www
        if (domain.startsWith("http://")) domain = domain.substring(7);
        if (domain.startsWith("https://")) domain = domain.substring(8);
        if (domain.startsWith("www.")) domain = domain.substring(4);
        
        if (domain && !domains.includes(domain)) {
            domains.push(domain);
            renderDomains();
            
            // Mark matching suggestions tag
            const tags = document.querySelectorAll(".suggest-tag");
            tags.forEach(tag => {
                if (tag.getAttribute("data-domain") === domain) {
                    tag.classList.add("added");
                }
            });
        }
        domainInput.value = "";
        updateUI();
    }

    addBtn.addEventListener("click", () => addDomain(domainInput.value));
    domainInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            addDomain(domainInput.value);
        }
    });

    // Suggestions Grid clicks
    document.getElementById("suggestions-grid").addEventListener("click", function(e) {
        const tag = e.target.closest(".suggest-tag");
        if (!tag) return;
        const dom = tag.getAttribute("data-domain");
        
        if (domains.includes(dom)) {
            // Remove
            domains = domains.filter(d => d !== dom);
            tag.classList.remove("added");
        } else {
            // Add
            domains.push(dom);
            tag.classList.add("added");
        }
        renderDomains();
        updateUI();
    });

    // Render Domains Badges
    const domainsList = document.getElementById("added-domains-list");
    const emptyState = document.getElementById("empty-state");

    function renderDomains() {
        // Clear all except empty state
        const badges = domainsList.querySelectorAll(".domain-badge");
        badges.forEach(b => b.remove());

        if (domains.length === 0) {
            emptyState.style.display = "block";
        } else {
            emptyState.style.display = "none";
            domains.forEach(dom => {
                const badge = document.createElement("div");
                badge.className = "domain-badge";
                badge.innerHTML = `${dom} <span data-domain="${dom}">&times;</span>`;
                
                badge.querySelector("span").addEventListener("click", function() {
                    const toRemove = this.getAttribute("data-domain");
                    domains = domains.filter(d => d !== toRemove);
                    
                    // Unmark suggestion tag
                    const tags = document.querySelectorAll(".suggest-tag");
                    tags.forEach(tag => {
                        if (tag.getAttribute("data-domain") === toRemove) {
                            tag.classList.remove("added");
                        }
                    });
                    
                    renderDomains();
                    updateUI();
                });
                
                domainsList.appendChild(badge);
            });
        }
    }

    // Update buttons/labels based on mode and configuration
    function updateUI() {
        const listTitle = document.getElementById("list-title");
        const finishBtn = document.getElementById("btn-finish");

        if (selectedMode === "blocklist") {
            listTitle.textContent = "Excluded Websites (Allowed Sites)";
            domainInput.placeholder = "Exclude domain (e.g. gmail.com)...";
            finishBtn.disabled = false; // Blocklist can be empty
        } else {
            listTitle.textContent = "Target Websites (Blocked Sites)";
            domainInput.placeholder = "Block domain (e.g. instagram.com)...";
            // Allowlist mode requires at least 1 domain to finish, otherwise it blocks everything
            finishBtn.disabled = domains.length === 0;
        }
    }

    // Finish Setup
    document.getElementById("btn-finish").addEventListener("click", function() {
        let storageData = {
            operatingMode: selectedMode,
            status: 1 // Enable extension by default
        };

        if (selectedMode === "blocklist") {
            storageData.exclusions = domains;
            storageData.allowlist = [];
        } else {
            storageData.allowlist = domains;
            storageData.exclusions = [];
        }

        chrome.storage.local.set(storageData, function() {
            // Open Dashboard / Options Page
            chrome.tabs.create({url: "dashboard.html"}, function() {
                window.close(); // Close onboarding tab
            });
        });
    });
});
