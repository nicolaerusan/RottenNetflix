
// make it show on netflix only

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	chrome.pageAction.show(tabs[0].id)
});