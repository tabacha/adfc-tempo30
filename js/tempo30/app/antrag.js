define('tempo30/app/antrag', [
    'jquery',
    'tempo30/model/version',
    'tempo30/view/ortssuche_dialog',
    'tempo30/view/position_dialog',
    'tempo30/view/result_dialog',
    'tempo30/view/fehler_melden_dialog',
    'tempo30/view/download_dialog',
    'tempo30/app/create-word',
    'tempo30/view/wie_geht_es_weiter_dialog'
    //
], function ($, version, step1dialog, step2dialog, step3dialog, errorDialog, step4dialog, createWord, step5dialog) {

    function nominatimSearch(str, nr) {
	var baseUrl='https://nominatim.openstreetmap.org/search';
	var baseParam='?format=json&city=Hamburg&countrycodes=de&limit=1&accept-language=de&email=adfc-2016@sven.anders.hamburg';
	var query=nr+" "+str;
	var url= baseUrl + baseParam + '&street='+encodeURIComponent(query);
	return $.ajax({
	    'url': url,
	    'dataType':'json'
	});
    }
    function getBrowser() { 
	if((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1 ) 
	{
            return 'Opera';
	} 
	else if(navigator.userAgent.indexOf("Chromium") !== -1 )
	{
            return 'Chromium';
	}
	else if(navigator.userAgent.indexOf("Chrome") !== -1 )
	{
            return 'Chrome';
	}
	else if(navigator.userAgent.indexOf("Safari") !== -1)
	{
            return 'Safari';
	}
	else if(navigator.userAgent.indexOf("Firefox") !== -1 ) 
	{
            return 'Firefox';
	}
	else if((navigator.userAgent.indexOf("MSIE") !== -1 ) || (document.documentMode === true )) //IF IE > 10
	{
	    return 'IE'; 
	}  
	else 
	{
	    return 'unknown';
	}
    }
    function start() {
	var browser= getBrowser();

	if (browser === 'Safari') {
	    alert('Es gibt ein Problem mit dem Safari Browser. Bitte benutzen Sie Chrome oder Firefox.');

	} else if ((browser !== 'Chrome') && (browser !== 'Firefox')) {
	    alert('Ihr Browser wird evtl. nicht unterstützt. Sicher getestet sind: Firefox, Chrome und Chromium. Testen Sie gerne die Anwendung und geben Sie uns Rückmeldung ob es funktioniert hat. Insbesondere der Download des Word-Dokuments kann evtl. fehlschlagen.');

	    step1();
	} else {
	    step1();
	}

/*	var data={};
	//data.lat=53.4733698;
	//data.lon=9.89281277104623;
	data.lat=53.471342867371405;
	data.lon=9.86020803451538;
	step3(data);*/
    }
    function step1() {
	step1dialog(step2).open();
    }
    
    function step2(data) {
	console.log(data);
	nominatimSearch(data.str, data.hausnr).done(function (d) {
	    console.log(d);
	    data.lat=d[0].lat;
	    data.lon=d[0].lon;
	    step2dialog(data, step1, step3).open();
	}).fail(function (e) {
	    console.error(e);
	    // FIXME
	    alert('Fehler');
	});
    }

    function step3(data) {
	var dialog=step3dialog(data, step2, step4);
	dialog.open();
	$.ajax({
	    'url': 'https://tools.adfc-hamburg.de/tempo30-backend/master/geodaten.php?lat='+data.lat+'&lon='+data.lon,
	    'dataType':'json'
	}).done( function (geodata) {
	    data=$.extend(data,geodata);
	    dialog.setGeoData(data);
	}).fail(function (e) {
	    console.error(e);
	    dialog.close();
	    // FIXME
	    alert('Fehler');
	});
    }
    function step4(data) {
	step4dialog(data, step3, step5).open();
    }
    function step5(data) {
	console.log(data);
	createWord.download(data);
	var sendToAdfc={};
	if (data.adfc_mail_contact || data.adfc_all) {
	    sendToAdfc.email = data.email;
	    sendToAdfc.bezirk = data.ort[0].bezirk_name;
	}
	if (data.adfc_anschrift || data.adfc_all) {
	    sendToAdfc.antrag_strasse = data.antrag_str;
	    sendToAdfc.hausnr = data.hausnr;
	    sendToAdfc.strasse = data.str;
	    sendToAdfc.plz = data.plz;
	    sendToAdfc.name = data.name;
	    sendToAdfc.bezirk = data.ort[0].bezirk_name;
	}
	if (data.adfc_map || data.adfc_all) {
	    sendToAdfc.lat = data.lat;
	    sendToAdfc.lon = data.lon;
	}

	if (sendToAdfc.length!==0) {
	    sendToAdfc.newsletter = data.newsletter;
	    sendToAdfc.saveAnschrift = data.adfc_anschrift;
	    sendToAdfc.showInMap = data.adfc_map;
	    sendToAdfc.noLimit = data.adfc_all;
	}
	$.post('https://tools.adfc-hamburg.de/tempo30-backend/master/save.php', sendToAdfc).fail(function (e) {
	    console.error(e);
	    alert('Fehler bei der Datenübertragung zum ADFC');
	});
	step5dialog(data, step4).open();
    }
    return start;

//{"str":"Cuxhavener Straße","name":"Max Mustermann","hausnr":"78","plz":"21149","lat":"53.4715402","lon":"9.90065095","antrag":["Waltershofer Straße","Cuxhavener Straße"],polizei:[{"bemerkung":"PK-Grenzen","region":"Harburg","pk":"PK 47","vd":"VD 4","polizeirev":"47","name":"PK47 Neugraben","strasse":"Neugrabener Markt 3","plz":"21149","ort":"Hamburg","tel":"040 428 65-4710"},],ort:[{"bezirk_name":"Harburg","stadtteil":"Hausbruch","ortsteilnummer":"714","bezirk":"7"},],laerm_tag:[{"klasse":"5"},],laerm_nacht:[{"klasse":"5"},],luftdaten:[{"gid":"2183","name_12":"Bundesstrae B73","no2_i1_gb":"30.15055","pm10_i1_gb":"25.4","pm25_i1_gb":"18.7","st_astext":"MULTILINESTRING((9.89456688524801 53.4717257209532,9.89706589630153 53.4716198843808,9.89755441490041 53.4715843238093,9.89812061423444 53.4715334425004,9.89875985895506 53.4714404078619))","st_distance":"4.47805368471465"},]}
});