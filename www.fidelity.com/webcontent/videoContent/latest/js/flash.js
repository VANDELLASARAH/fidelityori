flash_versions = 20;
var flash = new Object();
flash.installed=false;
flash.version='0.0';


if (navigator.plugins && navigator.plugins.length) {
	for (x=0; x < navigator.plugins.length; x++) {
		if (navigator.plugins[x].name.indexOf('Shockwave Flash') != -1) {
			flash.version = navigator.plugins[x].description.split('Shockwave Flash ')[1];
			flash.installed = true;
			break;
		}
	}
}


else if (window.ActiveXObject) {
	for (x = 2; x <= flash_versions; x++) {
		try {
			oFlash = eval("new ActiveXObject('ShockwaveFlash.ShockwaveFlash." + x + "');");
			if(oFlash) {
				flash.installed = true;
				flash.version = x + '.0';
			}
		}
		catch(e) {}
	}
}

flash.ver = Array();
for(i = 4; i <= flash_versions; i++) {
	eval("flash.ver[" + i + "] = (flash.installed && parseInt(flash.version) >= " + i + ") ? true : false;");
}
