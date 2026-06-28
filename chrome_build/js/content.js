// Synchronously insert stylesheet to hide document element and prevent page content flashing
(function() {
    let style = document.createElement('style');
    style.id = 'anchor-hide-style';
    style.innerHTML = 'html { display: none !important; }';
    if (document.documentElement) {
        document.documentElement.appendChild(style);
    } else {
        let observer = new MutationObserver(function() {
            if (document.documentElement) {
                document.documentElement.appendChild(style);
                observer.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
})();

function removeHideStyle() {
    let hideStyle = document.getElementById('anchor-hide-style');
    if (hideStyle) {
        hideStyle.remove();
    }
}

function runWhenBodyExists(callback) {
    if (document.body) {
        callback();
    } else {
        let observer = new MutationObserver(function() {
            if (document.body) {
                observer.disconnect();
                callback();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }
}

var depthBottomMeters = 10; //Depth in meters
var cpuSetting = 'high';
var reelLimit = 10;
var scrollBufferMeters = 2;
var reelBuffer = 2;
var isReelMode = false;
var reelsWatched = 0;
var lastUrl = window.location.href;
var depthBottomPixel;
var depthStart;

// Scroll loop tracker for scroll-based re-interventions
var currentScrollLoop = 1;
var globalSettings = null;

function checkReelMode() {
    var url = window.location.href;
    return url.includes('youtube.com/shorts') || 
           url.includes('tiktok.com') || 
           url.includes('instagram.com/reel');
}

var init = function(){

	if ('scrollRestoration' in history) {
		history.scrollRestoration = 'manual';
	}
	window.scrollTo(0, 0);
	$(window).scrollTop(0);

	if (window.location.hash) {
		setTimeout(function() {
			window.scrollTo(0, 0);
			$(window).scrollTop(0);
		}, 50);
		setTimeout(function() {
			window.scrollTo(0, 0);
			$(window).scrollTop(0);
		}, 200);
	}

	depthBottomPixel = meterToPixel(depthBottomMeters);
	depthStart = depthBottomMeters > scrollBufferMeters ? meterToPixel(scrollBufferMeters) : 0;

	// Create elements
	$("html").append('<div class="anchor"></div>');
	$(".anchor").append('<div class="creatures"></div>');
	$(".anchor").append('<div class="sea"></div>');

	let showIndicator = globalSettings && globalSettings.showDepthIndicator !== false;
	if (showIndicator) {
		$(".anchor").append('<div class="depth"><div class="depth--line"></div><div class="depth--line"></div><div class="depth--line"></div><div class="depth--line"></div><div class="depth--line"></div></div>');
		$(".anchor").append('<div class="depth--marker"><div class="marker"><span>0m</span></div></div>');
	}

	loadCreatures();

	isReelMode = checkReelMode();

    function attachScrollListener() {
        $(window).off('scroll').scroll(function(e){
            var s = $(window).scrollTop();
            var docHeight = document.body.scrollHeight;

            if($(".anchor").outerHeight() != docHeight){
                $(".anchor").css({"height": docHeight + "px"});
            }
            var progress = (s - depthStart) / (depthBottomPixel - depthStart);
            var easedProgress = progress * 0.99;
            if(progress <= 0){
                $(".sea").css({"opacity": 0});
            } else if(progress <= 1) {
                $(".sea").css({"opacity": easedProgress});
            } else {
                if (s > depthBottomPixel) {
                    // Lock scrolling at rock bottom only if we don't trigger scroll-based re-interventions
                    if (globalSettings && globalSettings.reInterventionEnabled && globalSettings.reInterventionMode === 'scroll') {
                        // Allow infinite scrolling, color stays deep blue
                    } else {
                        $(window).scrollTop(depthBottomPixel);
                    }
                }
                $(".sea").css({"opacity": 0.99});
            }

            // Scroll-based Re-Intervention Check
            if (globalSettings && globalSettings.reInterventionEnabled && globalSettings.reInterventionMode === 'scroll') {
                let mult = globalSettings.reInterventionScrollMult || 1.0;
                let threshold = depthBottomPixel * currentScrollLoop * mult;
                if (s >= threshold) {
                    currentScrollLoop++;
                    runReIntervention(globalSettings);
                }
            }

            var markerProgress = (s / depthBottomPixel);
            if(markerProgress < 0) markerProgress = 0;
            if(markerProgress > 0.9 && $(".rock").length == 0){
                $(".anchor").append('<svg class="rock" viewBox="0 0 1333 291" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Desktop-HD" transform="translate(-34.000000, -705.000000)" fill="#D8D8D8"><path d="M34,937.037871 L102.36719,782.763552 L195.974042,782.763552 L262.011649,859.900712 L396.492082,907.191989 L396.492082,949.404322 L262.011649,995.171538 L34,982.517914 L34,982.517914 Z M1216.41445,817.476134 L1136.52101,875.733964 L1089.01915,848.308754 L1078.10749,789.816737 L1023.71941,726.417772 L1036.0869,704.996645 L1117.73953,721.172024 L1229.73933,794.396771 L1216.41445,817.476134 Z M837.058065,952.238533 L982.51325,858.382082 L1132.35531,905.310308 L1132.35531,983.688137 L837.058065,952.238533 Z M549,861.613678 L698.562209,810 L782.472553,862.707043 L782.472553,981.125972 L634.21128,995.171538 L549,940.751588 L549,861.613678 Z M834.207142,798.121399 L915.213072,719.153854 L972.273831,758.637627 L972.273831,830.188964 L875.829517,858.382082 L817,830.188964 L834.207142,798.121399 Z M434.090409,903.686877 L387.590849,800.557712 L444.209388,760.442383 L511.445651,784.914382 L504.952619,885.185007 L458.338873,930.824055 L434.090409,903.686877 Z M1276.35036,837.894431 L1367.0178,905.549797 L1336.94641,968.084667 L1266.27598,979.277762 L1223.34276,888.431213 L1241.98581,825.91561 L1276.35036,837.894431 Z" id="Combined-Shape"></path></g></g></svg>');
                $(".rock").css({"top": (depthBottomPixel + window.innerHeight) + "px"});
            }
            if(markerProgress > 1) markerProgress = 1;
            var pos = markerProgress * (window.innerHeight - 60);
            $(".marker").css({"transform": "translate(0, " + pos + "px)"});
            var m = Math.round(s / 100) / 10;
            $(".marker span").text(m + 'm');
        });
    }

    // Block downward scrolling using capture phase when limit is reached
    $("body").append('<div id="anchor-blocker" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999999999;background:transparent;pointer-events:none;"></div>');
    
    const stopEvent = (e) => { 
        let shouldBlock = false;
        if (isReelMode) {
            shouldBlock = reelsWatched >= reelLimit;
        } else {
            // Only block scroll if not in scroll-based re-intervention mode
            if (globalSettings && globalSettings.reInterventionEnabled && globalSettings.reInterventionMode === 'scroll') {
                shouldBlock = false;
            } else {
                var s = $(window).scrollTop();
                shouldBlock = s >= depthBottomPixel;
            }
        }

        if (shouldBlock) {
            document.documentElement.classList.add('anchor-at-bottom');
            e.preventDefault(); 
            e.stopPropagation(); 
            e.stopImmediatePropagation(); 
        }
    };
    
    window.addEventListener('wheel', function(e) {
        if (e.deltaY > 0) {
            stopEvent(e);
        } else {
            document.documentElement.classList.remove('anchor-at-bottom');
        }
    }, {passive:false, capture:true});
    
    let lastTouchY = 0;
    window.addEventListener('touchstart', function(e) {
        lastTouchY = e.touches[0].clientY;
    }, {passive:true, capture:true});
    
    window.addEventListener('touchmove', function(e) {
        let currentY = e.touches[0].clientY;
        if (lastTouchY > currentY) {
            stopEvent(e);
        } else {
            document.documentElement.classList.remove('anchor-at-bottom');
        }
        lastTouchY = currentY;
    }, {passive:false, capture:true});
    
    window.addEventListener('keydown', function(e){
        if(["ArrowDown","Space","PageDown"].indexOf(e.code) > -1) {
            stopEvent(e);
        } else if (["ArrowUp","PageUp","Home"].indexOf(e.code) > -1) {
            document.documentElement.classList.remove('anchor-at-bottom');
        }
    }, {passive:false, capture:true});

    if (isReelMode) {
        updateReelsUI();
    } else {
        attachScrollListener();
    }

    // Continuously poll for URL changes to handle SPA navigation
    setInterval(function() {
        if (window.location.href !== lastUrl) {
            var wasReelMode = isReelMode;
            lastUrl = window.location.href;
            isReelMode = checkReelMode();

            if (isReelMode && wasReelMode) {
                reelsWatched++;
                updateReelsUI();
            } else if (isReelMode && !wasReelMode) {
                $(window).off('scroll');
                updateReelsUI();
            } else if (!isReelMode && wasReelMode) {
                $(".sea").css({"opacity": 0});
                $(".marker span").text("0m");
                attachScrollListener();
            }
        }
    }, 500);

};

function updateReelsUI() {
    var progress = 0;
    if (reelLimit > reelBuffer) {
        progress = (reelsWatched - reelBuffer) / (reelLimit - reelBuffer);
    } else {
        progress = reelsWatched / reelLimit;
    }
    var easedProgress = progress * 0.99;
    
    let markerProgress = progress;
    if (markerProgress < 0) markerProgress = 0;
    if (markerProgress > 1) markerProgress = 1;
    let markerPos = markerProgress * (window.innerHeight - 60);
    $(".marker").css({"transform": "translate(0, " + markerPos + "px)"});
    let currentDepthMeters = Math.round(markerProgress * depthBottomMeters * 10) / 10;
    $(".marker span").text(currentDepthMeters + 'm');
    
    if (progress <= 0) {
        $(".sea").css({"opacity": 0});
    } else if (progress < 1) {
        $(".sea").css({"opacity": easedProgress});
    } else {
        $(".sea").css({"opacity": 0.99});
        if($(".rock").length == 0){
            $(".anchor").append('<svg class="rock" viewBox="0 0 1333 291" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Desktop-HD" transform="translate(-34.000000, -705.000000)" fill="#D8D8D8"><path d="M34,937.037871 L102.36719,782.763552 L195.974042,782.763552 L262.011649,859.900712 L396.492082,907.191989 L396.492082,949.404322 L262.011649,995.171538 L34,982.517914 L34,937.037871 Z M1216.41445,817.476134 L1136.52101,875.733964 L1089.01915,848.308754 L1078.10749,789.816737 L1023.71941,726.417772 L1036.0869,704.996645 L1117.73953,721.172024 L1229.73933,794.396771 L1216.41445,817.476134 Z M837.058065,952.238533 L982.51325,858.382082 L1132.35531,905.310308 L1132.35531,983.688137 L837.058065,952.238533 Z M549,861.613678 L698.562209,810 L782.472553,862.707043 L782.472553,981.125972 L634.21128,995.171538 L549,940.751588 L549,861.613678 Z M834.207142,798.121399 L915.213072,719.153854 L972.273831,758.637627 L972.273831,830.188964 L875.829517,858.382082 L817,830.188964 L834.207142,798.121399 Z M434.090409,903.686877 L387.590849,800.557712 L444.209388,760.442383 L511.445651,784.914382 L504.952619,885.185007 L458.338873,930.824055 L434.090409,903.686877 Z M1276.35036,837.894431 L1367.0178,905.549797 L1336.94641,968.084667 L1266.27598,979.277762 L1223.34276,888.431213 L1241.98581,825.91561 L1276.35036,837.894431 Z" id="Combined-Shape"></path></g></g></svg>');
        }
        $(".rock").css({"top": (window.innerHeight - 200) + "px"});
    }
}

function meterToPixel(m){
	return m * 1000;
}

function loadCreatures(){
	var fishCount = 30;
	if (cpuSetting === 'low') fishCount = 5;
	if (cpuSetting === 'none') fishCount = 0;

	for(var i = 1; i <= fishCount; i++){
		var pos = depthStart + (window.innerHeight * 1.1) + ((1 - Math.pow(i / fishCount, 2)) * (depthBottomPixel - depthStart));
		var jellyLeft = (Math.random() * 100);
		var delay = Math.random() * 6;
		var fish1 = '<div class="creature--wrapper" style="transform: translate(0, ' + pos + 'px)"><svg class="fish creature" style="animation-delay: ' + delay + 's;" width="101px" height="44px" viewBox="0 0 101 44" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Desktop-HD" transform="translate(-101.000000, -173.000000)" fill="#FFD400"><path d="M145.355311,217 L101.355311,217 L145.355311,173 L189.355311,173 L189.355311,217 L145.355311,217 Z M201.623182,207.354662 L189.355311,195.086792 L201.623182,182.818921 L201.623182,207.354662 Z" id="Combined-Shape"></path></g></g></svg></div>';
		var fish2 = '<div class="creature--wrapper" style="transform: translate(0, ' + pos + 'px)"><svg class="fish2 creature" style="animation-delay: ' + delay + 's;" width="101px" height="44px" viewBox="0 0 101 44" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Desktop-HD" transform="translate(-101.000000, -173.000000)" fill="#FF8D00"><path d="M145.355311,217 L101.355311,217 L145.355311,173 L189.355311,173 L189.355311,217 L145.355311,217 Z M201.623182,207.354662 L189.355311,195.086792 L201.623182,182.818921 L201.623182,207.354662 Z" id="Combined-Shape"></path></g></g></svg></div>';
		var jelly = '<div class="creature--wrapper jelly--wrapper" style="transform: translate(' + jellyLeft + 'vw, ' + pos + 'px)"><svg class="jelly creature" style="animation-delay: ' + delay + 's;" width="32px" height="38px" viewBox="0 0 32 38" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Group-2" transform="translate(0.460966, 0.482941)"><g id="Group" fill="#FFD1D1"><path d="M0,15.5390344 C0,6.95706267 6.95706267,0 15.5390344,0 C24.1210061,0 31.0780688,6.95706267 31.0780688,15.5390344 L0,15.5390344 Z" id="Combined-Shape"></path><rect id="Rectangle" x="0" y="15.5170591" width="31.0780688" height="4"></rect></g><path d="M15.5390344,13.7855223 L15.5390344,35.31971" id="Line" stroke="#FFD1D1" stroke-width="4" stroke-linecap="square"></path><path d="M25.5548655,10 L25.5548655,31.5341877" id="Line-Copy" stroke="#FFD1D1" stroke-width="4" stroke-linecap="square"></path><path d="M5.52320328,10 L5.52320328,31.5341877" id="Line-Copy-2" stroke="#FFD1D1" stroke-width="4" stroke-linecap="square"></path></g></g></svg></div>';
		var fishRandom = Math.round(Math.random() * 2);
		if(fishRandom == 0){
			$(".creatures").append(fish1);
		} else if(fishRandom == 1) {
			$(".creatures").append(fish2);
		} else {
			$(".creatures").append(jelly);
		}
		var pos = depthStart + (0.7 * (depthBottomPixel - depthStart));
		var whale = '<div class="creature--wrapper" style="transform: translate(0, ' + pos + 'px)"><svg class="whale creature" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 392.4 194.84"><defs><style>.cls-1{fill:#dae3ec;}.cls-2{fill:#b5c8d7;}.cls-3{fill:#e6eef2;}</style></defs><title>Whale_1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><polygon class="cls-1" points="285.05 153.09 158.05 194.09 75.05 173.09 16.05 135.09 0 95.62 285.05 153.09"/><polygon class="cls-2" points="392.4 51.97 368.55 59.92 343.17 55.34 285.05 153.09 0 95.62 58.54 53.2 338.66 53.48 337.06 26.9 350.82 0 356.02 39.44 392.4 51.97"/><polygon class="cls-3" points="286.06 153.84 159.06 194.84 76.06 173.84 17.06 135.84 1.01 96.37 286.06 153.84"/></g></g></svg></div>';
		$(".creatures").append(whale);
	}
}

function runAnchorIntervention(settings, onComplete) {
    if ($("#anchor-overlay").length > 0) return;

    let type = settings.anchorType;
    let duration = settings.anchorDuration;
    let phrase = settings.anchorPhrase;
    let textLength = settings.anchorTextLength;
    let textComplexity = settings.anchorTextComplexity;
    let closeTabOnLeave = settings.closeTabOnLeave;

    let mathComplexity = settings.anchorMathComplexity || 'medium';
    let rawAlts = settings.anchorAlternativesList || '';
    let showIntentionWarning = settings.anchorIntentionWarning === undefined ? true : settings.anchorIntentionWarning;

    let siteName = window.location.hostname;
    if (siteName.startsWith("www.")) {
        siteName = siteName.substring(4);
    } else if (siteName.startsWith("m.")) {
        siteName = siteName.substring(2);
    }

    let overlay = $('<div id="anchor-overlay"></div>');
    let wrapper = $('<div class="anchor-wrapper"></div>');
    overlay.append(wrapper);
    $("body").append(overlay);
    $("body").addClass("anchor-active");
    removeHideStyle();

    function prependFavicon() {
        let uniqueId = "fav-" + Math.random().toString(36).substr(2, 9);
        wrapper.append(`
            <div id="${uniqueId}" class="anchor-favicon-placeholder" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; background:#27272a; border:1px solid #3f3f46; font-size:24px; font-weight:700; color:#cbd5e1;">
                🌐
            </div>
        `);
        
        chrome.runtime.sendMessage({type: "fetchFavicon", domain: siteName}, function(response) {
            if (response && response.dataUrl) {
                let img = $(`<img class="anchor-favicon" src="${response.dataUrl}" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:block;" />`);
                $(`#${uniqueId}`).replaceWith(img);
            }
        });
    }

    function logAttempt(action, callback) {
        chrome.runtime.sendMessage({type: "logAttempt", action: action}, function(response) {
            if (callback) callback();
        });
    }

    function handleCancel() {
        logAttempt('saved');
        if (closeTabOnLeave) {
            chrome.runtime.sendMessage({type: "closeTab"});
        } else {
            if (document.referrer) {
                window.location.href = document.referrer;
            } else {
                history.back();
                setTimeout(function() {
                    window.location.href = "https://www.google.com";
                }, 500);
            }
        }
    }

    function handleProceed() {
        if (settings.anchorBypassMode === 'cooldown' && settings.reInterventionEnabled !== false) {
            showCooldownDecisionScreen();
        } else {
            logAttempt('opened');
            chrome.runtime.sendMessage({type: "bypassSuccess"}, function(response) {
                $("body").removeClass("anchor-active");
                overlay.css("opacity", "0");
                setTimeout(function() {
                    overlay.remove();
                    onComplete();
                }, 500);
            });
        }
    }

    function generateMathProblem(complexity) {
        let num1, num2, answer, text;
        if (complexity === 'easy') {
            num1 = Math.floor(Math.random() * 20) + 5;
            num2 = Math.floor(Math.random() * 20) + 5;
            answer = num1 + num2;
            text = `${num1} + ${num2} = ?`;
        } else if (complexity === 'hard') {
            num1 = Math.floor(Math.random() * 11) + 11;
            num2 = Math.floor(Math.random() * 8) + 3;
            answer = num1 * num2;
            text = `${num1} * ${num2} = ?`;
        } else { // medium
            num1 = Math.floor(Math.random() * 8) + 2;
            num2 = Math.floor(Math.random() * 8) + 2;
            answer = num1 * num2;
            text = `${num1} * ${num2} = ?`;
        }
        return {
            question: text,
            answer: answer.toString()
        };
    }

    function showCooldownDecisionScreen() {
        wrapper.empty();
        prependFavicon();
        
        // Reset card wrapper styling to a clean transparent layout for full-screen slider view
        wrapper.css({
            "background": "transparent",
            "border": "none",
            "box-shadow": "none",
            "backdrop-filter": "none",
            "max-width": "600px",
            "padding": "0"
        });

        let capitalizedDomain = siteName.split('.')[0];
        capitalizedDomain = capitalizedDomain.charAt(0).toUpperCase() + capitalizedDomain.slice(1);

        wrapper.append(`<h2 style="font-size:32px; font-weight:700; color:#ffffff; margin-bottom:12px; font-family:'Outfit', sans-serif;">How much time do you need on ${capitalizedDomain}?</h2>`);
        wrapper.append(`<p style="font-size:16px; color:#a1a1aa; margin-bottom:48px; font-family:'Outfit', sans-serif;">Be realistic – give yourself the time you need to complete the task in mind.</p>`);

        // Slider Container
        let sliderContainer = $('<div style="width:100%; display:flex; flex-direction:column; align-items:center; gap:24px; margin-bottom:48px;"></div>');
        
        let maxVal = parseInt(settings.reInterventionInterval) || 10;
        let defaultVal = parseInt(settings.activeCooldownRemainingMinutes) || 1;
        if (defaultVal > maxVal) defaultVal = maxVal;
        
        let slider = $(`<input type="range" min="1" max="${maxVal}" value="${defaultVal}" style="width:100%; max-width:360px; -webkit-appearance:none; -moz-appearance:none; appearance:none; height:24px; background:transparent; outline:none;">`);
        
        // CSS for range track and thumb (bypassing Firefox clipping)
        let styleTag = $('<style>' +
            'input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; background: #27272a; border-radius: 3px; }' +
            'input[type=range]::-moz-range-track { width: 100%; height: 6px; background: #27272a; border-radius: 3px; }' +
            'input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: #ffffff; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3); margin-top: -9px; }' +
            'input[type=range]::-moz-range-thumb { height: 24px; width: 24px; border-radius: 50%; background: #ffffff; cursor: pointer; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }' +
            '</style>');
        overlay.append(styleTag);

        let valueDisplay = $(`<div style="font-size:28px; font-weight:700; color:#ffffff; font-family:'Outfit', sans-serif;">${defaultVal} minute${defaultVal > 1 ? 's' : ''}</div>`);
        
        sliderContainer.append(slider).append(valueDisplay);
        wrapper.append(sliderContainer);

        slider.on('input', function() {
            let val = $(this).val();
            valueDisplay.text(`${val} minute${val > 1 ? 's' : ''}`);
        });

        // Action Buttons
        let cancelBtn = $(`<button class="anchor-btn" style="background:#6366f1; color:white; border:none; padding:14px 48px; border-radius:9999px; font-size:16px; font-weight:600; cursor:pointer; outline:none; transition:background 0.2s; margin-bottom:24px; width:100%; max-width:280px; font-family:'Outfit', sans-serif;">I don't want to open ${capitalizedDomain}</button>`);
        let proceedBtn = $(`<button style="background:transparent; border:none; color:#a1a1aa; font-size:15px; font-weight:600; cursor:pointer; outline:none; text-decoration:underline; font-family:'Outfit', sans-serif;">Continue to ${capitalizedDomain}</button>`);

        wrapper.append(cancelBtn).append(proceedBtn);

        cancelBtn.click(handleCancel);
        proceedBtn.click(function() {
            let selectedMins = parseInt(slider.val());
            logAttempt('opened');
            
            // The visit window and the next check-in use the same selected duration.
            settings.anchorBypassTime = selectedMins;
            settings.reInterventionInterval = selectedMins;
            
            chrome.runtime.sendMessage({
                type: "bypassSuccessCustom", 
                durationMinutes: selectedMins
            }, function(response) {
                $("body").removeClass("anchor-active");
                overlay.css("opacity", "0");
                setTimeout(function() {
                    overlay.remove();
                    onComplete();
                }, 500);
            });
        });
    }

    function showDecisionScreen() {
        wrapper.empty();
        prependFavicon();
        wrapper.append('<div class="anchor-title">Mindful Check-in</div>');
        wrapper.append('<div class="anchor-subtitle">You paused. Do you still want to visit ' + siteName + '?</div>');
        
        let actionBox = $('<div class="anchor-choices"></div>');
        let cancelBtn = $('<button class="anchor-btn anchor-btn-secondary">No, close this tab</button>');
        let proceedBtn = $('<button class="anchor-btn anchor-btn-primary">Yes, I need to open it</button>');
        actionBox.append(cancelBtn).append(proceedBtn);
        wrapper.append(actionBox);

        cancelBtn.click(handleCancel);
        proceedBtn.click(handleProceed);
    }

    prependFavicon();

    if (type === 'basicBreath') {
        // Full screen typography layout for breathing
        wrapper.css({
            "background": "transparent",
            "border": "none",
            "box-shadow": "none",
            "backdrop-filter": "none"
        });

        let instructionText = $(`<h1 style="font-size:24px; font-weight:600; color:#cbd5e1; font-family:'Outfit', sans-serif; text-align:center; margin-bottom: 20px;">${phrase}</h1>`);
        wrapper.append(instructionText);

        let secondsLeft = duration;
        let elapsed = 0;
        let timerId;

        let bubble = $(`
            <div class="breath-bubble" style="width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.4) 100%); border: 2px solid rgba(6, 182, 212, 0.6); box-shadow: 0 0 30px rgba(6, 182, 212, 0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 30px auto; transition: transform 3.8s ease-in-out, box-shadow 3.8s ease-in-out, background 3.8s ease-in-out; transform: scale(0.9); pointer-events: none;">
                <span class="breath-action" style="font-size: 20px; font-weight: 700; color: #ffffff; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">Breathe</span>
                <span class="breath-timer" style="font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.6); margin-top: 4px; display: block;">${secondsLeft}s left</span>
            </div>
        `);
        wrapper.append(bubble);
        
        let statsLabel = $('<div style="font-size: 14px; color: #71717a; text-align:center; margin-top:20px;">Loading stats...</div>');
        wrapper.append(statsLabel);

        let count = settings.attemptsCount24h || 0;
        if (count > 0) {
            statsLabel.text(`Attempts to open ${siteName} in last 24h: ${count}`);
        } else {
            statsLabel.text(`First attempt to open ${siteName} today`);
        }
        
        function updateBreathCycle() {
            let phase = elapsed % 8;
            if (phase < 4) {
                if (phase === 0 || bubble.find(".breath-action").text().indexOf("Inhale") === -1) {
                    bubble.css({
                        "transform": "scale(1.35)",
                        "box-shadow": "0 0 45px rgba(6, 182, 212, 0.6)",
                        "background": "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.6) 100%)"
                      });
                }
                bubble.find(".breath-action").text("Inhale");
            } else {
                if (phase === 4 || bubble.find(".breath-action").text().indexOf("Exhale") === -1) {
                    bubble.css({
                        "transform": "scale(0.9)",
                        "box-shadow": "0 0 15px rgba(6, 182, 212, 0.1)",
                        "background": "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.25) 100%)"
                    });
                }
                bubble.find(".breath-action").text("Exhale");
            }
        }

        function handleReset() {
            elapsed = 0;
            secondsLeft = duration;
            bubble.find(".breath-timer").text(`${secondsLeft}s left`);
            bubble.find(".breath-action").text("Inhale");
            bubble.css({
                "transform": "scale(0.9)",
                "box-shadow": "0 0 30px rgba(6, 182, 212, 0.3)",
                "background": "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.4) 100%)"
            });
            if (bubble[0]) {
                bubble[0].offsetHeight;
            }
            updateBreathCycle();
        }

        function handleVisibilityChange() {
            if (document.hidden) {
                handleReset();
            }
        }

        window.addEventListener('blur', handleReset);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        function cleanupListeners() {
            window.removeEventListener('blur', handleReset);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
        
        bubble.find(".breath-action").text("Inhale");
        setTimeout(updateBreathCycle, 50);
        
        timerId = setInterval(function() {
            if (document.hidden || !document.hasFocus()) {
                handleReset();
                return;
            }
            elapsed++;
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(timerId);
                cleanupListeners();
                // Reset card styling for check-in
                wrapper.css({
                    "background": "#18181b",
                    "border": "1px solid #27272a",
                    "box-shadow": "0 10px 30px rgba(0, 0, 0, 0.5)",
                    "padding": "32px 24px"
                });
                showDecisionScreen();
            } else {
                bubble.find(".breath-timer").text(`${secondsLeft}s left`);
                updateBreathCycle();
            }
        }, 1000);

    } else if (type === 'minimalBreath') {
        wrapper.css({
            "background": "transparent",
            "border": "none",
            "box-shadow": "none",
            "backdrop-filter": "none"
        });

        let secondsLeft = duration;
        let elapsed = 0;
        let timerId;

        let bubble = $(`
            <div class="breath-bubble" style="width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.4) 100%); border: 2px solid rgba(6, 182, 212, 0.6); box-shadow: 0 0 30px rgba(6, 182, 212, 0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 50px auto; transition: transform 3.8s ease-in-out, box-shadow 3.8s ease-in-out, background 3.8s ease-in-out; transform: scale(0.9); pointer-events: none;">
                <span class="breath-action" style="font-size: 20px; font-weight: 700; color: #ffffff; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">Breathe</span>
                <span class="breath-timer" style="font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.6); margin-top: 4px; display: block;">${secondsLeft}s left</span>
            </div>
        `);
        wrapper.append(bubble);
        
        function updateBreathCycle() {
            let phase = elapsed % 8;
            if (phase < 4) {
                if (phase === 0 || bubble.find(".breath-action").text().indexOf("Inhale") === -1) {
                    bubble.css({
                        "transform": "scale(1.35)",
                        "box-shadow": "0 0 45px rgba(6, 182, 212, 0.6)",
                        "background": "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.6) 100%)"
                    });
                }
                bubble.find(".breath-action").text("Inhale");
            } else {
                if (phase === 4 || bubble.find(".breath-action").text().indexOf("Exhale") === -1) {
                    bubble.css({
                        "transform": "scale(0.9)",
                        "box-shadow": "0 0 15px rgba(6, 182, 212, 0.1)",
                        "background": "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.25) 100%)"
                    });
                }
                bubble.find(".breath-action").text("Exhale");
            }
        }

        function handleReset() {
            elapsed = 0;
            secondsLeft = duration;
            bubble.find(".breath-timer").text(`${secondsLeft}s left`);
            bubble.find(".breath-action").text("Inhale");
            bubble.css({
                "transform": "scale(0.9)",
                "box-shadow": "0 0 30px rgba(6, 182, 212, 0.3)",
                "background": "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.4) 100%)"
            });
            if (bubble[0]) {
                bubble[0].offsetHeight;
            }
            updateBreathCycle();
        }

        function handleVisibilityChange() {
            if (document.hidden) {
                handleReset();
            }
        }

        window.addEventListener('blur', handleReset);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        function cleanupListeners() {
            window.removeEventListener('blur', handleReset);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
        
        bubble.find(".breath-action").text("Inhale");
        setTimeout(updateBreathCycle, 50);
        
        timerId = setInterval(function() {
            if (document.hidden || !document.hasFocus()) {
                handleReset();
                return;
            }
            elapsed++;
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(timerId);
                cleanupListeners();
                wrapper.css({
                    "background": "#18181b",
                    "border": "1px solid #27272a",
                    "box-shadow": "0 10px 30px rgba(0, 0, 0, 0.5)",
                    "padding": "32px 24px"
                });
                showDecisionScreen();
            } else {
                bubble.find(".breath-timer").text(`${secondsLeft}s left`);
                updateBreathCycle();
            }
        }, 1000);

    } else if (type === 'typeRandomText') {
        wrapper.append('<div class="anchor-title">Solve the math problem to unlock</div>');
        wrapper.append('<div class="anchor-subtitle">Focus your attention by typing the correct answer below:</div>');

        let mathObj = generateMathProblem(mathComplexity);
        let targetCode = mathObj.answer;

        let mathBox = $('<div class="anchor-math-box"></div>');
        mathBox.append('<div class="anchor-math-eq" style="font-family: monospace !important; font-size: 32px; font-weight: 800; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">' + mathObj.question + '</div>');
        let mathInput = $('<input type="text" class="anchor-math-input" placeholder="Type answer here..." style="font-family: monospace !important;" autocomplete="off" spellcheck="false">');
        mathBox.append(mathInput);
        wrapper.append(mathBox);

        let statusMsg = $('<div style="font-size: 13px; margin: 10px 0; min-height: 20px; color:#feb2b2;"></div>');
        wrapper.append(statusMsg);

        let actionBox = $('<div class="anchor-choices"></div>');
        let cancelBtn = $('<button class="anchor-btn anchor-btn-secondary">No, close this tab</button>');
        let proceedBtn = $('<button class="anchor-btn anchor-btn-primary" disabled>Open ' + siteName + '</button>');
        actionBox.append(cancelBtn).append(proceedBtn);
        wrapper.append(actionBox);

        cancelBtn.click(handleCancel);
        proceedBtn.click(handleProceed);

        mathInput.on('input', function() {
            let val = $(this).val();
            
            if (val === targetCode) {
                proceedBtn.prop('disabled', false);
                mathInput.css('border-color', '#48bb78');
                statusMsg.text("Match! You can proceed.").css("color", "#48bb78");
            } else if (targetCode.startsWith(val) || targetCode.includes(val)) {
                proceedBtn.prop('disabled', true);
                mathInput.css('border-color', 'rgba(255, 255, 255, 0.15)');
                statusMsg.text("");
            } else {
                statusMsg.text("Oops! You made a mistake. Re-generating puzzle!").css("color", "#feb2b2");
                $(this).val("");
                mathObj = generateMathProblem(mathComplexity);
                targetCode = mathObj.answer;
                mathBox.find(".anchor-math-eq").text(mathObj.question);
                proceedBtn.prop('disabled', true);
                mathInput.css('border-color', '#e53e3e');
            }
        });

    } else if (type === 'alternative') {
        wrapper.append('<div class="anchor-title">Healthy Alternatives</div>');
        wrapper.append('<div class="anchor-subtitle">Would you rather do something else instead of visiting ' + siteName + '?</div>');

        let altList = $('<div class="anchor-alt-list"></div>');
        
        let displayAlts = [];
        if (rawAlts && rawAlts.trim().length > 0) {
            displayAlts = rawAlts.split("\n")
                .map(line => line.trim())
                .filter(line => line.length > 0);
        }
        
        if (displayAlts.length === 0) {
            displayAlts = [
                "📚 Read a few pages of a book",
                "💧 Drink a glass of water",
                "🧘 Stretch and take a deep breath",
                "🚶 Go for a short 5-minute walk"
            ];
        }

        displayAlts.forEach(alt => {
            altList.append($('<div class="anchor-alt-item"></div>').text(alt));
        });
        wrapper.append(altList);

        let actionBox = $('<div class="anchor-choices"></div>');
        let cancelBtn = $('<button class="anchor-btn anchor-btn-primary">Yes, I will do one of these!</button>');
        let proceedBtn = $('<button class="anchor-btn anchor-btn-secondary">No, open ' + siteName + ' (5s delay)</button>');
        actionBox.append(cancelBtn).append(proceedBtn);
        wrapper.append(actionBox);

        cancelBtn.click(handleCancel);
        
        let secondsLeft = 5;
        proceedBtn.prop('disabled', true);
        proceedBtn.text('No, open ' + siteName + ' (' + secondsLeft + 's)');
        
        let delayId = setInterval(function() {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(delayId);
                proceedBtn.prop('disabled', false);
                proceedBtn.text('No, open ' + siteName);
            } else {
                proceedBtn.text('No, open ' + siteName + ' (' + secondsLeft + 's)');
            }
        }, 1000);

        proceedBtn.click(handleProceed);

    } else if (type === 'emotion') {
        wrapper.append('<div class="anchor-title">State Your Intention</div>');
        wrapper.append('<div class="anchor-subtitle">Why are you opening ' + siteName + ' right now?</div>');

        let optionBox = $('<div class="anchor-intention-box"></div>');
        let optionList = $('<div class="anchor-option-list"></div>');
        
        let options = [
            { id: "work", label: "💼 Essential for work or study" },
            { id: "comm", label: "💬 Message someone / quick reply" },
            { id: "info", label: "🔍 Lookup specific information" },
            { id: "bored", label: "🥱 Mindless scrolling / bored" }
        ];

        options.forEach(opt => {
            let item = $('<div class="anchor-option-item" data-id="' + opt.id + '"><input type="radio" name="anchor-opt" id="opt-' + opt.id + '"><label for="opt-' + opt.id + '">' + opt.label + '</label></div>');
            optionList.append(item);
        });
        optionBox.append(optionList);
        wrapper.append(optionBox);

        let actionBox = $('<div class="anchor-choices"></div>');
        let cancelBtn = $('<button class="anchor-btn anchor-btn-secondary">No, close this tab</button>');
        let proceedBtn = $('<button class="anchor-btn anchor-btn-primary" disabled>Open ' + siteName + '</button>');
        actionBox.append(cancelBtn).append(proceedBtn);
        wrapper.append(actionBox);

        cancelBtn.click(handleCancel);
        proceedBtn.click(handleProceed);

        let selectedId = "";
        optionList.on('click', '.anchor-option-item', function() {
            $(".anchor-option-item").removeClass('selected');
            $(this).addClass('selected');
            $(this).find('input').prop('checked', true);
            
            selectedId = $(this).data('id');
            proceedBtn.prop('disabled', false);

            $(".anchor-warning").remove();
            if (selectedId === 'bored' && showIntentionWarning) {
                optionBox.append('<div class="anchor-warning">⚠️ Warning: Mindless browsing can be a time sink. Consider closing this tab!</div>');
            }
        });
    }
}

function runReIntervention(settings) {
    $(".anchor").remove();
    $("#anchor-overlay").remove();

    let siteName = window.location.hostname;
    if (siteName.startsWith("www.")) {
        siteName = siteName.substring(4);
    } else if (siteName.startsWith("m.")) {
        siteName = siteName.substring(2);
    }

    let overlay = $('<div id="anchor-overlay" style="background:#18181b;"></div>');
    let wrapper = $('<div class="anchor-re-wrapper" style="text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>');
    
    let uniqueId = "fav-" + Math.random().toString(36).substr(2, 9);
    wrapper.append(`
        <div id="${uniqueId}" class="anchor-favicon-placeholder" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; background:#27272a; border:1px solid #3f3f46; font-size:24px; font-weight:700; color:#cbd5e1;">
            🌐
        </div>
    `);
    
    chrome.runtime.sendMessage({type: "fetchFavicon", domain: siteName}, function(response) {
        if (response && response.dataUrl) {
            let img = $(`<img class="anchor-favicon" src="${response.dataUrl}" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:block;" />`);
            $(`#${uniqueId}`).replaceWith(img);
        }
    });

    overlay.append(wrapper);
    $("body").append(overlay);
    $("body").addClass("anchor-active");

    function handleCancel() {
        chrome.runtime.sendMessage({type: "logAttempt", action: "saved"}, function() {
            chrome.runtime.sendMessage({type: "closeTab"});
        });
    }

    // Add hourglass SVG with flip animation
    wrapper.append(`
        <svg class="anchor-hourglass" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 24px; animation: flip 4s infinite ease-in-out;">
            <path d="M5 2h14"></path>
            <path d="M5 22h14"></path>
            <path d="M19 2v4c0 3.3-2.7 6-6 6s-6-2.7-6-6V2"></path>
            <path d="M5 22v-4c0-3.3 2.7-6 6-6s6 2.7 6 6v4"></path>
        </svg>
    `);

    // Title
    let capitalizedDomain = siteName.split('.')[0];
    capitalizedDomain = capitalizedDomain.charAt(0).toUpperCase() + capitalizedDomain.slice(1);
    wrapper.append(`<h2 class="anchor-re-title" style="font-size:32px; font-weight:700; color:#ffffff; margin-bottom:12px; font-family:'Outfit', sans-serif;">Do you still need ${capitalizedDomain}?</h2>`);
    wrapper.append(`<p class="anchor-re-subtitle" style="font-size:16px; color:#a1a1aa; margin-bottom:48px; max-width:400px; line-height:1.5; font-family:'Outfit', sans-serif;">You’ll need to go through another intervention to unlock ${capitalizedDomain} again.</p>`);

    let closeBtn = $('<button class="anchor-btn" style="background:#6366f1; color:white; border:none; padding:14px 48px; border-radius:9999px; font-size:16px; font-weight:600; cursor:pointer; outline:none; transition:background 0.2s; margin-bottom:24px; width: 100%; max-width: 200px; font-family:\'Outfit\', sans-serif;">Close</button>');
    let interventionBtn = $('<button style="background:transparent; border:none; color:#71717a; font-size:14px; font-weight:600; cursor:pointer; outline:none; font-family:\'Outfit\', sans-serif;">Intervention</button>');
    
    wrapper.append(closeBtn).append(interventionBtn);

    closeBtn.click(handleCancel);
    interventionBtn.click(function() {
        overlay.remove();
        $("body").removeClass("anchor-active");
        
        let reSettings = { ...settings };
        if (settings.reInterventionType && settings.reInterventionType !== 'same') {
            reSettings.anchorType = settings.reInterventionType;
        }
        
        runAnchorIntervention(reSettings, function() {
            init();
            startReInterventionTimer(reSettings);
        });
    });
}

function startReInterventionTimer(settings) {
    if (settings.reInterventionEnabled && settings.reInterventionMode === 'time') {
        let intervalMs = settings.reInterventionInterval * 60 * 1000;
        setTimeout(function() {
            if ($("body").length > 0 && !$("body").hasClass("anchor-active")) {
                runReIntervention(settings);
            }
        }, intervalMs);
    }
}

function getAnchorNavigationType() {
    if (performance && performance.getEntriesByType) {
        let navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
            return navEntries[0].type;
        }
    }
    if (performance && performance.navigation && performance.navigation.type === 1) {
        return 'reload';
    }
    return 'navigate';
}

chrome.runtime.sendMessage({type: "status", url: window.location.href, navigationType: getAnchorNavigationType()}, function(response) {
    if (response && response.status == 1) {
        globalSettings = response;
        if (response.customDepth) depthBottomMeters = response.customDepth;
        if (response.cpuSetting) cpuSetting = response.cpuSetting;
        if (response.reelLimit) reelLimit = response.reelLimit;
        if (response.scrollBuffer !== undefined) scrollBufferMeters = response.scrollBuffer;
        if (response.reelBuffer !== undefined) reelBuffer = response.reelBuffer;
        
        // If this page is not a blocked target website, do absolutely nothing
        if (!response.isTarget) {
            removeHideStyle();
            return;
        }
        
        let anchorEnabled = response.anchorEnabled;
        let sinkingEnabled = response.sinkingEnabled !== false;
        
        runWhenBodyExists(function() {
            if (!response.isExcluded && anchorEnabled) {
                runAnchorIntervention(response, function() {
                    if (sinkingEnabled) init();
                    startReInterventionTimer(response);
                });
            } else if (!response.isExcluded) {
                if (sinkingEnabled) init();
                startReInterventionTimer(response);
                removeHideStyle();
            } else {
                removeHideStyle();
            }
        });
    } else {
        removeHideStyle();
    }
    return;
});
