chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({
        currentWindow: !0,
        active: !0
    }, function(tabs) {
        lcurl = tabs[0].url
    });
    var wordToHighlight = ["Paypal","payPal","paypal"];
    chrome.tabs.sendMessage(tab.id,
        {word: wordToHighlight}
    );

    chrome.tabs.sendMessage(tab.id, {
        message: "clicked_browser_action"
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            var word = request.word;
        if(request.highlightLink){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { highlightLink:true});
            });
        }
        
        if (word) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {word: word});
            });
        }
        
    if (request.message === 'close') {
        setIcon(sender.tab.id, !1)
    }
});
