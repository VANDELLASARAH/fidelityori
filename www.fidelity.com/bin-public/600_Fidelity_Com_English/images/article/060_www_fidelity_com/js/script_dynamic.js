scriptDynamic = {
    loadScript : function(url, inDom, callback) {
        if(document.querySelectorAll('[src="' + url + '"]').length < 1 || document.querySelectorAll('[href="' + url + '"]').length < 1) {
            if(url.indexOf(".js") > -1) {
                var script = document.createElement("script")
                script.type = "text/javascript";
                script.src = url;
            } else if(url.indexOf(".css") > -1) {
                var script = document.createElement("link");
                script.setAttribute("rel","stylesheet");
                script.setAttribute("href", url);
            }
    
            if (script.readyState) { //IE
                script.onreadystatechange = function () {
                    if (script.readyState == "loaded" || script.readyState == "complete") {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else { //Others
                script.onload = function () {
                    callback();
                };
            }
    
            
            document.getElementsByTagName(inDom)[0].appendChild(script);
        }
    }
}