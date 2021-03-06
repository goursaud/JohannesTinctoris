function MusicExample(){
  this.objType = "MusicExample";
  this.code = string;
  this.SVG = false;
  this.counter = false;
  this.context = false;
  this.events = [];
  this.comments = [];
  this.textObjects = [];
  this.drawCount = 0;
  this.starts = pointer;
  this.swidth = false;
  this.classes = false;
  this.marginSpace = false;
  this.marginalia = [];
  this.catchwords = [];
  this.curCatchword = curCatchword;
  this.parameters = false;
  this.bbox = false;
  this.colbreaks = [];
  this.book = book;
  this.chapter = chapter;
  this.section = section;
  this.exampleno = exampleno;
  this.exampleBreaks = [];
  this.staves = [];
  this.parts = [];
	this.done = [];
	this.UUIDs = {};
	this.MEI = false;
	this.MEILink = false;
	this.MEIcoded = false;
	this.VerovioLink = false;
  exampleno++;
  this.atClass = "at-"+this.book+"-"+this.chapter+"-"+this.section+"-"+this.exampleno;
  this.parse = function(){
    this.staves = [];
    this.parts = [];
    var augmented = false;
    this.classes = new Classes();
    string = this.code;
    // Hacky fix for the problem of double asterisks in **
    // annotations: \** is converted to (the hopefully meaningless)
    // @@@@, and then back later
    string = string.replace(/\\\*\*/g, "@@@@");
    currentExample = this;
    initialStaffStar = false;
    var next;
    var length, prev;
		var openParts =[];
    currentClef = false;
    currentSolm = false;
		currentProp = 1;
    consumeSpace();
    this.parameters = getParameters();
    currentInfo = this.parameters;
    this.w2 = [];
    consumeSpace();
    while(string.length >0){
      length = string.length;
      next = nextEvent();
      if(next){
        if(prev) {
          prev.next = next;
          next.previous = prev;
        }
				if(next.objType==="Part") {
					currentProp = 1;
					next.wordNo = this.events.length;
					if(next.closes){
						let lastEl = openParts.pop();
						if(lastEl){
							next.startEl = lastEl;
							next.startEl.endEl = next;
						} else {
							console.log("missed", this.events.slice(this.events.length -10));
						}
					} else {
						if(openParts.length){
							let lowestOpen = openParts[openParts.length-1];
							lowestOpen.contains.push(next);
							next.parent = lowestOpen;
						} else {
							console.log(next.type);
						}
						openParts.push(next);
					}
				}
				if(next.changesProportion && next.changesProportion()) currentProp = next.proportionChangesTo;
				if(next.objType==="Part" && next.type==="part") this.parts.push(next);
				if(next.objType==="MusicalChoice" && next.hasPart()) this.parts.push(next.hasPart());
        if(currentInfo){
          if(infop(next)){
            currentInfo.extras.push(next);
            next.params = currentInfo;
            if(next.objType=="MusicalChoice") next.addParams(currentInfo);
          } else if(!ignorable(next)){
            currentInfo = false;
          }
        } else if(next.objType==="Staff"){
					if(prev.objType="Part" || prev.subType=="part"){
						prev.staff = next;
						next.part = prev;
					}
          currentInfo = next;
          for (var i=this.events.length-1; i>0; i--){
            if(this.events[i].objType==="TextUnderlay"){
              this.events[i].marginal="r";
              break;
            } else if(this.events[i].objType!="NegativeSpace"){
              break;
            }
          }
        }
        if(next.objType==="SolmizationSignature" 
           && this.events.length && this.events[this.events.length-1].objType==="Clef"){
          this.events[this.events.length-1].solm = next;
        }
        if(next.objType=="Dot"){
          next.augments = augmented;
        } else if(next.objType=="Fermata"){
          next.lengthens = augmented;
        } else if(next.objType==="SignumCongruentiae"){
//          console.log(currentChoice, this.events[this.events.length-1]);
          if(currentChoice){
            console.log("it happened");
            next.effects = currentChoice;
          } else {
            next.effects = this.events[this.events.length-1];
          }
        } else if (next.objType==="Comment" && this.events.length && 
                   this.events[this.events.length-1].objType==="Ligature"){
          var c = new LigatureComment(next);
          currentExample.comments.push(c);
          this.events[this.events.length-1].members.push(c);
          // I think this is necessary because otherwise we get two
          // comments -- a ligature comment and a normal comment
          next = c;
          prev = next;
          continue;
          //
        } else if(next.objType=="MusicalChoice" && augmented 
                  && next.content.length && !next.content[0].nonDefault()
                  && next.content[0].content.length && next.content[0].content[0].objType==="Fermata"){
          next.content[0].content[0].lengthens = augmented;
        }
        if(next.objType==="TextUnderlay" && this.events.length
           && typeof(this.events[this.events.length-1].text) !=="undefined"
           && !this.events[this.events.length-1].text) {
          if(this.events[this.events.length-1].objType !== "SignumCongruentiae"){
            // FIXME: This is a painful hack. sig cong is treated by
            // the system as an event in its own right, that happens
            // to take its position from the note before. That would
            // be fine, even if we add text, but not if the text
            // should alter the position of the note that the sig cong
            // attaches to. In that case, we'd draw it before adjusting the position.
						if(last(this.events).objType==="Dot" && last(this.events).augments){
							// If a dot follows a note, put the text under the note
							last(this.events).augments.text=next;
						} else {
							this.events[this.events.length-1].text=next;
						}
          } else if (this.events.length>1){
            this.events[this.events.length-2].text=next;
          }
        } else {
          this.events.push(next);
        }
        prev = next;
      } else if(length == string.length){
        // We're stuck in a loop. Try to escape
        string = string.substring(1);
      }
      // if there's no whitespace, following dot is of augmentation
      augmented= consumeSpace() ? false : next;
    }
    correctNexts(this.events);
  };
  this.reset = function(){
    this.swidth = false;
    this.drawCount = 0;
    this.w2 = [];
    this.events = [];
    this.comments = [];
    curCatchword = this.curCatchword;
    this.parse();
  };
  this.width = function(){
		state = "finding width";
    if(this.swidth) {
      return this.swidth;
    } else {
      this.setSysWidths();
      return this.swidth;
      var w = 0;
      for(var e=0;e<this.events.length; e++){
        var w2 = this.events[e].startX ? this.events[e].startX : 0;
        w2 += typeof(this.events[e].width) != "undefined" ? this.events[e].width() : 0;
        w = Math.max(w, w2);
      }
      this.swidth = w;
      return w;
    }
  };
  this.commentsDiv = function(){
    return new ExampleComments(this.comments);
  };
  this.commentsTip = function(x, y){
    for(var i=0; i<this.comments.length; i++){
      if(x>=this.comments[i].startX && x<=this.comments[i].endX
         && y>=this.comments[i].endY && y<=this.comments[i].startY){
        return Tooltip(this.comments[i].content);
      } 
    }
    removeTooltip();
    return false;
  };
  this.height = function(){
    // FIXME: clearly stupid
		state = "finding height";
    var height = rastralSize * 
      (!this.parameters.staff || typeof(this.parameters.staff) == "undefined" ? 
       1 : (this.parameters.staff.trueLines() + 4));
    // for(var i=0; i<this.events.length; i++){
    //   if(this.events[i].objType == "Staff"){
    //     height += rastralSize * 9 + 5;
    //   }
    //}
    this.setSysWidths();
    height = sysWidths.length * height + 15;
    return height;
  };
  this.targetWidth = function(){
    return (wrapWidth 
            ? (wrapWidth - (rastralSize * 3) - (lmargin+10) - (this.marginSpace ? 100 : 0))
            : false);
  };
  this.setSysWidths = function(){
    sysWidths = [rastralSize + this.parameters.width()];
    this.swidth = 0;
  //    var x = lmargin +rastralSize/2;
    for(eventi=0; eventi<this.events.length; eventi++){
      if(this.events[eventi].objType == "Staff" 
//         || (wrapWidth && sysWidths[sysWidths.length-1] >= this.targetWidth())){
         || (wrapWidth && sysWidths[sysWidths.length-1] >= this.targetWidth())){
//             (wrapWidth - rastralSize*3 - lmargin-10)){
        sysWidths[sysWidths.length-1] += rastralSize * 2;
        if(sysWidths[sysWidths.length-1]+lmargin>SVG.width){
          sysWidths[sysWidths.length-1] = SVG.width - lmargin;
        }
        this.swidth = Math.max(this.swidth, sysWidths[sysWidths.length-1]);
        sysWidths.push(rastralSize);
      } else {
        if(isNaN(this.events[eventi].width())){
          alert("Width estimation failed: "+ this.events[eventi].objType
               + " gives: " + this.events[eventi].width());
        }
        // x+=this.events[eventi].width();
        // drawVerticalLine(x+0.5, 0, 250, 2, "#1F6");
        sysWidths[sysWidths.length -1] +=this.events[eventi].width();
      }
    }
    this.swidth = Math.max(this.swidth, sysWidths[sysWidths.length-1]);
  };
  this.toText = function(){
    var text = this.parameters.toText();
    for(var i=0; i<this.events.length; i++){
      if(i>0) text += " ";
      if(typeof(this.events[i].toText) == "undefined") 
        alert("error - "+JSON.stringify(this.events[i]));
      text += this.events[i].toText();
    }
		if(standaloneEditor){
			text += "</piece>";
		} else {
			text += "</example>";
		}
    return text;
  };
	this.toMEI = function(){
		this.UUIDs = {};
		var docObj = new MEIDoc();
		var doc = docObj.doc;
		var music = doc.createElementNS("http://www.music-encoding.org/ns/mei", "music");
		var body =  doc.createElementNS("http://www.music-encoding.org/ns/mei", "body");
		var mdiv = doc.createElementNS("http://www.music-encoding.org/ns/mei", "mdiv");
    var mscore = doc.createElementNS("http://www.music-encoding.org/ns/mei", "score");
    var msection = doc.createElementNS("http://www.music-encoding.org/ns/mei", "section");
		var mscoredef = doc.createElementNS("http://www.music-encoding.org/ns/mei", "scoreDef");
		var staffn = 1;
		this.done = [];
		docObj.tree.appendChild(music);
		music.appendChild(body);
		body.appendChild(mdiv);
    mdiv.appendChild(mscore);
		mscore.appendChild(mscoredef);
		var msectionIsNew = true;
//		mscore.appendChild(msection);
//		msection.appendChild(mstaff);
//		mstaff.appendChild(mlayer);
    currentExample = this;
    if(this.parameters && this.parameters.toMEI) {this.parameters.toMEI(doc, msection);}
    this.appendStaffDefs(doc, mscoredef);
		var started = false;
		var extras = [];
		var inExtra = false;
		console.log("making MEI");
		var currentPartes = [];
		var currentParsi = 0;
		var parti=0;
		var sic = false;
		var n=0;
		var mstaff = false;
		// I don't know why this isn't happening later, but adding this unbreaks things [DL 05/20]
		var mlayer = doc.createElementNS("http://www.music-encoding.org/ns/mei", "layer");
    // more
		for(var i=0; i<this.events.length; i++){
			var prevLength = currentPartes.length;
			if(this.events[i].objType==="Part"
				 && this.events[i].type==="part"
				 && !this.events[i].closes){
				parti++;
				n = Object.keys(this.voiceParts).indexOf(this.events[i].defaultName())+1;
				currentParsi=0;
				mstaff = doc.createElementNS("http://www.music-encoding.org/ns/mei", "staff");
				mlayer = doc.createElementNS("http://www.music-encoding.org/ns/mei", "layer");
				mstaff.setAttribute('n', n > -1 ? n : parti);
				mstaff.appendChild(mlayer);
				if(this.events[i].id){
					mstaff.setAttribute('label', this.events[i].id);
				}
			} // else if (this.events[i].objType==="Part"
			// 					 && this.events[i].type==="pars"
			// 					 && !this.events[i].closes
			// 					 && this.events[i].id==="sic") {
			// 	var extraStaff = doc.createElementNS("http://www.music-encoding.org/ns/mei", "staff");
			// 	mlayer = doc.createElementNS("http://www.music-encoding.org/ns/mei", "layer");
			// 	extraStaff.setAttributeNS(null, 'n', parti);
			// 	extraStaff.setAttributeNS(null, 'extra', 'true');
			// 	extraStaff.appendChild(mlayer);
			// 	extras.push([extraStaff, currentPartes.length]);
			// 	inExtra = true;
			// } 
			else if (this.events[i].objType==="Part"
								 && this.events[i].type==="pars"
								 && !this.events[i].closes) {
				// These partes are presented in sequence within a voice
				sic = this.events[i].id==="sic" ? true : false;
				if(parti===1) {
					var msubsection = doc.createElementNS("http://www.music-encoding.org/ns/mei", "section");
					currentPartes.push(msubsection);
				} else {
					msubsection = currentPartes[currentParsi];
					if(!sic) currentParsi++;
				}
				mstaff = doc.createElementNS("http://www.music-encoding.org/ns/mei", "staff");
				mlayer = doc.createElementNS("http://www.music-encoding.org/ns/mei", "layer");
				mstaff.setAttribute('n', sic ? parti+10 : (n>-1 ? n : parti));
				mstaff.appendChild(mlayer);
				if(this.events[i].id){
					mstaff.setAttribute('label', this.events[i].id);
				}
				inExtra = false;
			} else if (this.events[i].objType==="Part"
								 && this.events[i].type==="section"
								 && !this.events[i].closes) {
				currentParsi=0;
				staffn = 0;
				parti = 0;
				msection = doc.createElementNS("http://www.music-encoding.org/ns/mei", "section");
				msectionIsNew = true;
				currentPartes = [];
				if(this.events[i].id) msection.setAttribute('label', this.events[i].id);
				inExtra = false;
			} else if(this.events[i].toMEI && this.done.indexOf(this.events[i])===-1){
				if(msection && msectionIsNew) mscore.appendChild(msection);
				if(msubsection) {
					msection.appendChild(msubsection);
					if(mstaff) msubsection.appendChild(mstaff);
				} else if(!inExtra){
					if(mstaff) msection.appendChild(mstaff);
				}
				msectionIsNew = false;
				mstaff = false;
				msubsection = false;
				if(!mlayer) console.log(this.events[i]);
				this.events[i].toMEI(doc, mlayer);
				started = true;
			}
		}
		return docObj;
	};
	this.easyRhythms = function(){
		var MEIDoc = this.toMEI();
		var layerMens = [];
		this.MEI = MEIDoc;
		var sections = getAtomicSections(MEIDoc);
		for(var i=0; i<sections.length; i++){
			var layers = getLayers(sections[i]);
			for(var layi=0; layi<layers.length; layi++){
  			var sectionBlocks = getEventsByMensurationForSection(layers[layi], MEIDoc.doc,
																														 layerMens.length>layi ? layerMens[layi] : false);
				layerMens[layi] = sectionBlocks[sectionBlocks.length-1].mens;
				beatIndependentDurations(sectionBlocks);
				//	 			labelEasyDurationsAndStartTimes(sectionBlocks);
				addAllStartTimes(sectionBlocks);
				//var remaining = resolveForKnownStartingPoints(sectionBlocks);
				//addAllStartTimes(sectionBlocks);
				//simplestAlterations(sectionBlocks);
				//addAllStartTimes(sectionBlocks);
				var remaining = 1000000000;
				var nextRemaining = afterTheEasyBits(sectionBlocks);
				while(nextRemaining != 0 && remaining!=nextRemaining){
					// Rerun this for as long as it makes a difference
					// (i.e. resolves unsolved durations/start times)
					console.log("unresolved count", remaining, nextRemaining);
					remaining=nextRemaining;
					nextRemaining = afterTheEasyBits(sectionBlocks);
				}
				console.log(remaining);
				this.stupidVerovioStretch();
				this.mensurStrich();
				this.markResolved();
				this.regenerateMEILinks();
			}
		}
		return MEIDoc;
	};
	this.regenerateMEILinks = function(){
		this.MEIcoded = btoa(this.MEI.serialize());
		this.MEILink.setAttributeNS(null, 'href', "data:application/xml;base64,"
																				+this.MEIcoded);
		this.VerovioLink.setAttributeNS(null, 'href', 'viewer.html?mei='+encodeURI(this.MEIcoded));
	};
	this.stupidVerovioStretch = function(){
		// Verovio can't do proportions
		for(var e=0; e< this.events.length; e++){
			if(this.events[e].objType==="Note" || this.events[e].objType==="Rest"){
				var object = this.events[e].MEIObj;
				if(object.getAttributeNS(null, 'dur.intermediate')
					 && object.getAttributeNS(null, 'dur.intermediate')
					 != object.getAttributeNS(null, 'dur.ges')
					 && !object.getAttributeNS(null, 'stretched')){
					// A proportion has been applied
					var realised = object.getAttributeNS(null, 'dur.ges');
					var implied = object.getAttributeNS(null, 'dur.intermediate');
					var realno = Number(realised.substring(0, realised.length-1));
					var implno = readDur(object);
					var proportion = realno / implno;
					var numb = Number(object.getAttributeNS(null, 'numbase'));
					if(numb){
						object.setAttributeNS(null, 'numbase', numb*proportion );
						object.setAttributeNS(null, 'stretched', 'true');
					} else {
						object.setAttributeNS(null, 'numbase', proportion );
						object.setAttributeNS(null, 'num', '1' );
						object.setAttributeNS(null, 'stretched', 'true');						
					}
				}
			}
					 
		}
	};
	this.mensurStrich = function(){
		var old = Array.from(document.getElementsByClassName('mensurStrich'));
		if(old) old.forEach(x => x.remove());
		for(var e=0; e<this.events.length; e++){
			if(this.events[e].objType==="Note" || this.events[e].objType==="Rest"){
				var object = this.events[e].MEIObj;
				if(object.getAttributeNS(null, 'onTheBreveBeat')
					 || object.getAttributeNS(null, 'crossedABreveBeat')
					 || parseInt(object.getAttributeNS(null, 'onTheBreveBeat'), 10)===0){
					// We've crossed a breve beat
					drawMensurStrich(this.events[e]);
					if(object.getAttributeNS(null, 'onTheBreveBeat')
						 && object.previousSibling && object.previousSibling.tagName!="barLine"){
						let line = object.ownerDocument.createElementNS("http://www.music-encoding.org/ns/mei", "barLine");
						line.setAttributeNS(null, "visible", "false");
					  object.parentNode.insertBefore(line, object);
					}
				}
			}
		}
	};
	this.markResolved = function(){
		for(var e=0; e<this.events.length; e++){
			if(this.events[e].objType==="Note" || this.events[e].objType==="Rest"
				 || this.events[e].objType==="MaxRest"  || this.events[e].objType==="LongRest"){
				var MEIObj = this.events[e].MEIObj;
				if(MEIObj.getAttributeNS(null, 'dur.ges')){
					var DOMObj = this.events[e].domObj;
					if(!DOMObj){
						console.log("problem with", e, this.events[e]);
						continue;
					}
					DOMObj.classList.add('resolved');
					if(MEIObj.getAttributeNS(null, 'quality')){
						DOMObj.classList.add(MEIObj.getAttributeNS(null, 'quality'));
					}
					if(MEIObj.getAttributeNS(null, 'rule')){
						DOMObj.classList.add(MEIObj.getAttributeNS(null, 'rule'));
					}
				}
			} else if(this.events[e].objType==="Ligature"){
				if(this.events[e].members.every(isResolved)){
					this.events[e].domObj.classList.add('resolved');
				}
			}
		}
	};
  this.toTEI = function(doc, parent){
		// FIXME: Old code, probably not valid MEI or TEI
    if(!parent) parent=(doc.currentParent || doc.body);
    var musicel = doc.element("notatedMusic");
    var mdiv = doc.element("mei:mdiv");
    var mscore = doc.element("mei:score");
    var msection = doc.element("mei:section");
    currentExample = this;
    parent.appendChild(musicel);
    musicel.appendChild(mdiv);
    mdiv.appendChild(mscore);
//    mscore.appendChild(msection);
    if(this.parameters && this.parameters.toMEI) this.parameters.toMEI(doc, msection);
    // more
    //this.appendStaffDefs(doc, mscore);
  };
	this.gatherStaffs = function(parts){
		var voices = {};
		var voiceParts = this.parts.filter(x=>x.type=="part"&&!x.startEl);
		for(var i=0; i<voiceParts.length; i++){
			let name = voiceParts[i].defaultName();
			if(voices[name]){
				voices[name].push(voiceParts[i]);
			} else {
				voices[name] = [voiceParts[i]];
			}
		}
		return voices;
	};
  this.appendStaffDefs = function(doc, el){
    var group = doc.createElementNS("http://www.music-encoding.org/ns/mei", "staffGrp");
		var counter = 1;
		this.voiceParts = this.gatherStaffs(this.parts);
		var voiceTypes = Object.keys(this.voiceParts);
		var  sd;
    el.appendChild(group);
		if(voiceTypes.length){
			for(var i=0; i<voiceTypes.length; i++){
				group.appendChild(this.staffDefForPart(this.voiceParts[voiceTypes[i]][0], i+1, doc));
			}
		} else if(this.parts && this.parts.length){
      for(var i=0; i<this.parts.length; i++){
				if(!this.parts[i].closes && this.parts[i].type==="part") {
					group.appendChild(this.staffDefForPart(this.parts[i], counter++, doc));
				}
      }
    } else {
			sd = doc.createElementNS("http://www.music-encoding.org/ns/mei", "staffDef");
			var p = this.parameters;
			var c = p.getClef();
			sd.setAttributeNS(null, "n", 1);
			console.log(p);
			sd.setAttributeNS(null, "lines", (p.staff.trueLines() || 15));
			if(c){
				if(c.objType==="MusicalChoice"){
					if(!c.nonDefault()){
						this.done.push(c);
						var clefs = c.content[0].content.filter(e => e.objType==='Clef');
						if(clefs.length){
							c = clefs[0]
							sd.setAttributeNS(null, "clef.line", (c.staffPos/2) - 1);
							sd.setAttributeNS(null, "clef.shape", (c.type || "C"));
						}
					}
				} else {
					sd.setAttributeNS(null, "clef.line", (c.staffPos/2) - 1);
					sd.setAttributeNS(null, "clef.shape", (c.type || "C"));
				}
			}
			group.appendChild(sd);
		}
	};
  this.staffDefForPart = function(part, n, doc){
    var sd = doc.createElementNS("http://www.music-encoding.org/ns/mei", "staffDef");
    var relevantStaff = part.applicableStaff();
    sd.setAttributeNS(null, "n", n);
    sd.setAttributeNS(null, "lines", relevantStaff.trueLines());
		if(part.id) {
			sd.setAttributeNS(null, "label", part.defaultName());
		}
    return sd;
  };
  this.startingStaffForPart = function(part, pos){
    
  };
  this.currentSolm = function(variant){
    // We're not really keeping track of staves properly for cases
    // where line breaks are automatic (because automatic system
    // breaks came later). This method looks back to find an
    // applicable solmisation signature. N.B. variant allows other
    // uses to be made of this, but would normally just be false.
    for(var j=eventi-1; j>=0; j--){
      if(this.events[j].objType==="SolmizationSignature" 
         && (!this.events[j].appliesTo
             || (variant && this.events[j].appliesTo.indexOf(variant)>-1))){
        // Easy – this is a normal signature and applies here
        return this.events[j];
      } else if(this.events[j].objType==="MusicalChoice" && !this.events[j].nonDefault()){
        // Complicated – applicable signatures might be buried (probably not, though)
        for(var k=this.events[j].content[0].content.length-1; k>=0; k--){
          var obj = this.events[j].content[0].content[k];
          if(obj.objType==="SolmizationSignature"){
//            && (!obj.appliesTo
//                || (variant || obj.appliesTo.indexOf(variant)>-1))){
            return obj;
          } else if(obj.objType==="MusicalChoice" && !obj.nonDefault()){
            // Choice in a choice. If I defined this functionality
            // sensibly (recursively), I could handle any depth of
            // choices, but it's probably better to discourage using
            // that in practice, and only implementing it if
            // necessary. Plus, this patch is overdue...
            for(var l=obj.content[0].content.length-1; l>=0; l--){
              if(obj.content[0].content[l].objType==="SolmizationSignature"){
//                 && (!obj.content[0].content[l].appliesTo
//                    || (variant && obj.content[0].content[l].appliesTo.indexOf(variant)>-1))){
                return obj.content[0].content[l];
              }
            }
          }
        }
      }
    }
    console.log("missed");
    return false;
  };
  this.draw = function(exampleSVG, force){
//    if(exampleSVG != this.SVG) alert("ok");
    // FIXME: 14/10/12 If this shows no alerts, remove this and all
    // svg passing
    // if(this.drawCount>1 && !force){
    //   alert("oh really?");
    //   return;
    // }
    // 22/01/12 This showed up for redrawing punctuation. FIXME: find
    // out what's happening
    underlays = [];
    this.drawCount++;
//    this.catchwords = [];
    currentClef = false;
    currentSolm = false;
		leaveSpace = false;
    currentExample = this;
    var st = this.parameters.staff;
    currentLinecount = st ? st.trueLines() : 1;
    currentStaffColour = st ? st.trueColour() : "black";
    curx = lmargin;
    cury = topMargin;
    lowPoint = cury+(rastralSize*2);
    currentType = this.parameters.notation;
    currentSubType = this.parameters.notationSubtype;
    currentRedline = false;
    SVG = this.SVG;//exampleSVG;
    // this.SVG = SVG; // ??
    clearSVG(SVG);
    svgCSS(SVG, cssPath("jt-editor-v.css"));
//    svgCSS(SVG, cssPath("print.css"));
    this.w2 = [];
    currentSystems = [];
    var fontstring = Math.round(3 * rastralSize * prop) +"pt ArsNovaVoidRegular";
    context.font = fontstring;
//    this.setSysWidths();
    localWidth = exWidth;
    sysNo = 1;
    curx += rastralSize / 2;
    var mw = curx;
    var texted = false;
    var maxx = false;
    var remain = this.events.length;    
    var nextBreak = this.indexOfStaffBreak();
		var preRot;
    currentSystems.push(svgGroup(SVG, "Stafflines", false));
    this.parameters.draw();
    var broken=false;
    for(eventi = 0; eventi<this.events.length; eventi++){
      if(!broken && currentSolm && currentSolm.members.length && eventi>0) {
        broken=true;
      }
      // console.log(this.events[eventi], curx);
      remain--;
      if(eventi>nextBreak) nextBreak = this.indexOfStaffBreak(1+nextBreak);
      if(wrapWidth && 
         // when do we add a break? 
         // 0. Not if the next item is a fermata or a dot of augmentation!
         !this.events[eventi].lengthens 
         && !(this.events[eventi].objType==="MusicalChoice" 
              && !this.events[eventi].nonDefault() 
              && this.events[eventi].content[0].content[0].lengthens)
         && !this.events[eventi].augments
				 && !(eventi && (this.events[eventi-1].objType=="SolmizationSignature"
												 || this.events[eventi-1].objType=="MensuralSignature"
												 || this.events[eventi-1].objType=="ProportionSign"))
				 && this.events[eventi].objType!=="Barline"
				 && !(eventi<this.events.length-2 && this.events[eventi+1].objType=="Barline")
//				 && !(eventi<this.events.length-3 && this.events[eventi+2].objType=="Barline")
				 && 
         // 1. If x is close to the edge 
         (curx>=this.targetWidth()-rastralSize 
          ||
          // 2. If we're there's a break point coming, but we'd need a
          // break before then, break a little early
          (nextBreak && nextBreak - eventi < 5 
           && (curx>=this.targetWidth()-((nextBreak-eventi)*1.5*rastralSize)))
          ||
          // 3. If we're near the end, break a little early if a break
          // will be needed.
          (remain<3  
           && 
           curx>=this.targetWidth()-((this.events.length-eventi)*1.6*rastralSize)) 
          ||
          // 4. If breaking at the next opportunity would separate a note
          // from its dot.
          (remain>1 && this.events[eventi+1].augments 
           && curx+this.events[eventi].width()>=this.targetWidth()-rastralSize)
				  ||
				  // 5. If the thing is a tacet (which is super wide) and pushes us over
					(this.events[eventi].objType==="Tacet"
					 && curx + this.events[eventi].width() > this.targetWidth()))){
         // wrapWidth-32){
        // The custos has to know the next (=current) note, so rewind
        // the pointer, briefly
        eventi-=1;
        var custos = new Custos();
        custos.draw();
				if(this.events[eventi].classList){
					// ledger lines
					for(var l=0; l<this.events[eventi].classList.length; l++){
						if(this.events[eventi].classList[l].objType==="LedgerLineChange"){
							this.events[eventi].classList[l].coordinates.push(curx);
						}
					}
				}
        eventi+=1;
        sysBreak2();
        sysBreak(false, leaveSpace);
        currentClef.draw();
        //console.log(currentClef.appliesTo);
        var realSolm = this.currentSolm(false);
        if(realSolm) realSolm.draw();
        this.SVG.height.baseVal.value = this.SVG.height.baseVal.value 
          + (rastralSize*5)+5+(currentLinecount*rastralSize);
      }
      if(this.events[eventi].objType && (!this.events[eventi].params || this.events[eventi].objType==="Staff")) {
        try {
          if(currentRedline && removeRedlineBefore(this.events[eventi].classList)) currentRedline = false;
					if(this.events[eventi].objType==="Part" && this.events[eventi].staff) {
//						console.log("Part will be displayed on new system");
					} else if (this.events[eventi].objType==="UpsideDownOpen"){
						preRot = SVG;
						SVG = svgGroup(preRot, 'flippin', false);
					} else if (this.events[eventi].objType==="UpsideDownClose"){
						var box = SVG.getBBox();
						var halfwayX = box.x + (box.width / 2);
						var halfwayY = cury - (3*rastralSize);
						SVG.setAttributeNS(null, "transform", "rotate(180, "+halfwayX+", "+halfwayY+")");
						SVG = preRot;
					} else {
						this.events[eventi].draw();
					}
          // this.events[eventi].draw(curx, cury); // obsolete
        } catch (x) {
          console.log(x, this.events[eventi]);
        }
        if(this.events[eventi].objType == "TextUnderlay"
           || this.events[eventi].text){
          texted = true;
        }
      }
      mw = Math.max(curx, mw);
    }
    if(this.classes.classes.length) drawClasses(this.classes.classes, false);
    sysBreak2(true);
    for(var w=0; w<this.w2.length; w++){
      drawSystemLines(currentSystems[w], this.w2[w][2], this.w2[w][1], lmargin, 
        this.w2[w][0], this.w2[w][3]);
      maxx = Math.max(this.w2[w][0], maxx);
    }
    for(var coli=0; coli<this.colbreaks.length; coli++){
      ColBreakWidth(this.colbreaks[coli], mw);
    }
    var box = this.SVG.getBoundingClientRect();
    if(!box.height) {
      //      alert("Rectangle error"+this.code);
      // FIXME: Certainly still causes brokenness
//      this.SVG.height.baseVal.value = 64;
      var max= false, min=false, b;
      for(var n=0; n<SVG.childNodes.length; n++){
        b=SVG.childNodes[n].getBoundingClientRect();
        if(b.top && (!min || b.top<min)) min = b.top;
        if(b.bottom && (!max || b.bottom>max)) max = b.bottom;
      }
      this.SVG.height.baseVal.value = Math.max(64, max-min + (texted ? 30 : 0));
    } else {
        var bbox = this.SVG.getBBox();
        this.bbox = bbox;
        var top = bbox.y < 0 ? bbox.y -1 : 0;
        var bottom = bbox.y+bbox.height+1;
        var height = bottom - top;
        if(top) {
          var nudge = rastralSize*-2.55;
          if($(this.SVG.parentNode).hasClass("inline")) {
            // this.SVG.parentNode.style.marginTop = "-35px";
            this.SVG.parentNode.style.marginTop = (-2*rastralSize)+"px";
            if(this.w2[0][2]===3){
              nudge -= rastralSize/2;
              // nudge -= rastralSize;
            }
          }
          if(safari) this.w2[0][2]===3 ? nudge+=2 : nudge+=4;
          this.SVG.parentNode.style.verticalAlign = nudge-top+"px";
        } 
        this.SVG.setAttribute('height', height);
        this.SVG.height.baseVal.value = height;
        this.SVG.style.height = height+"px";
        this.SVG.setAttribute('viewBox', bbox.x+" "+top+" "+bbox.width+" "+height);//bbox.height);
        this.SVG.width.baseVal.value = bbox.width+bbox.x;
      // } else {
      //   this.SVG.height.baseVal.value = Number(box.height); //+ (texted ? 35 : 5);
      // }
//      this.SVG.height.baseVal.value = Number(SVG.getBoundingClientRect().height) + (texted ? 35 : 5);
//      this.SVG.style.height = (Number(SVG.getBoundingClientRect().height) + (texted ? 35 : 5)+10)+"px";
    }
//     if(!$.browser.webkit){
// //      this.SVG.width.baseVal.value = maxx + (texted ? 25 : 5);
//       this.SVG.width.baseVal.value = this.SVG.getBBox().
//     }
    // this.SVG.parentNode.style.width = maxx+(texted ? 25 : 5)+8+"px";
    if(!inTip // && !editorMode
      ){
      $(this.SVG).hover(function(e){displayStatusBarReference(this, e);});
    }
    currentExample = false;
    eventi = false;
  };
  this.indexOfStaffBreak = function(start){
    for(var si=0; si<this.staves.length; si++){
      if((!start || this.staves[si][0]>=start) && this.staves[si][1].objType==="Staff") {
        return this.staves[si][0];
      }
    }
    return false;
  };
  this.parse();
  currentExample = false;
}

function nextEvent() {
  var obj;
  switch(string.charAt(0)){
    case "_":
      string = string.substring(1);
      return new NegativeSpace();
    case "[":
      return nextColRef();
    case "|":
      return nextBarline();
    case "<":
      return nextTaglike();
    case "{":
      if(string.substring(0,5) == "{var="){
        return nextChoice();
      } else {
        return nextInfo();
      }
    case "b":
    case "h":
    case "x":
      return nextSolmSign();
    case "P":
      return nextRest();
    case "-":
      string = string.substring(1);
      if(string.charAt(0)==="?") {
        obj = nextSignumCongruentiae(); 
      } else if (string.charAt(0)==="*"){
        obj = nextFermata();
      } else {
        obj = nextNote();
      }
      obj.flipped = true;
      return obj;
    case "?":
      return nextSignumCongruentiae();
    case ".":
      return nextDot();
    case "M":
    case "L":
    case "B":
    case "S":
    case "m":
    case "s":
    case "f":
    case "F":
      return nextNote();
    case "^":
      if (string.charAt(1)==="c"){
        consume(1);
        var custos = nextCustos();
        custos.sup = true;
        return custos;
      } else {
        return nextNote();
      }
    case "p":
    case "v":
    case "l":
      return nextChantNote();
    case "c":
      return nextCustos();
    case "*":
      if(string.charAt(1)==="*"){
        return nextComment();
      } else {
        return nextFermata();
      }
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return nextRepeat();
    case "&":
      obj = new etc();
      string = string.substring(1);
      getAndSetPitch(obj);
      return obj;
  }
  return false;
}

function nextColRef(){
  var col = new ColumnStart();
  var startLength = string.match(/\[\-*/).length;
  var loc = string.search(/\-*\]/);
  var endLength = loc > -1 ? string.match(/\-*\]/).length : 1;
  if(loc == -1){
    console.log("non-col-ref:"+string);
    return false;
  } else if (loc == 1) {
    string = string.substring(loc+endLength);
    // This means that we have [-]
    return new PositiveSpace();
  } else {
    col.id = string.substring(startLength+1, loc);
    parseColumn(col.id, col);
    string = string.substring(loc+endLength);
    return col;
  }
}

function nextComment(){
  // Use text version
  var os = string;
  var op = pointer;
  var octp = currentTextParent;
  var end = string.indexOf("**", 2);
  if(end < 2){
    complaint.push("Unclosed comment"+string.substring(0, 10));
    string = string.substring(2);
    return false;
  }
  var ann = new Annotation();
  // var ann = new Comment();
  string = string.substring(2, end);
  string = string.replace("@@@@", "**");
  currentTextParent = ann;
  ann.code = string;
  ann.contents = readString();
  string = os.substring(end+2);
  pointer = op;
  currentTextParent = octp;
  currentExample.comments.push(ann);
  return ann;
}
/*
function nextComment(){
  var comment = new Comment();
  var end = string.indexOf("**", 2);
  if(end < 2){
    complaint.push("Unclosed comment"+string.substring(0, 10));
  }
  comment.content = string.substring(2, end);
  string = string.substring(end+2);
  currentExample.comments.push(comment);
  return comment;
}
*/

function nextBarline(){
  var bar = new Barline();
  string = string.substring(1);
  while(string.charAt(0)=="|"){
    bar.multiple++;
    string = string.substring(1);
  }
  var staffPos = getStaffPos();
  if(staffPos || staffPos==0){
    bar.start = staffPos;
    if(string.charAt(0)=="-"){
      consume(1);
      staffPos = getStaffPos();
      bar.end = staffPos;
    }
  }
  return bar;
}

function nextSolmSign(){
  var solm = new SolmizationSign();
  var nextChar = 0;
  if(string.charAt(nextChar) === "^"){
    solm.sup = true;
    nextChar++;
  }
  solm.symbol = string.charAt(nextChar);
  string = string.substring(nextChar+1);
  // solm.staffPos = getStaffPos();
  var pitch = /^([A-g])\1{0,2}/.exec(string);
  if(pitch){
    solm.pitch = pitch[0];
    string = string.substring(pitch[0].length);
  } else {
    solm.staffPos = getStaffPos();
  }
  return solm;
}

function nextRest(){
  string = string.substring(1);
  var rhythm = getRhythm();
  if(rhythm == "L"){
    return nextLongRest();
  } else if(rhythm == "M"){
    // Not legal. Push it back onto string and reparse
    string = "M"+string;
    return false;
  } else if(rhythm){
    var rest = new Rest();
    rest.rhythm =rhythm;
    rest.staffPos = getStaffPos();
    return rest;
  } else {
    return false;
  }
}

function nextLongRest(){
  var start = getStaffPos();
  var rest = false;
  if(start && consumeIf("-")){
    var end = getStaffPos();
    if(end){
      if(consumeIf("x")){
        rest = new MaxRest();
        rest.multiple = consumeIf(/[0-9]/) || 2;
      } else {
        rest = new LongRest();
      }
      rest.start = start;
      rest.end = end;
    }
  }
  return rest;
}

function nextRepeat(){
  var obj = new Repeat();
  obj.multiple = Number(string.charAt(0));
  if(string.charAt(1) !=":") return false;
  consume(2);
  obj.start = getStaffPos();
  if(obj.start && consumeIf("-")){
    obj.end = getStaffPos();
    while(string.charAt(0)==="-" || string.charAt(0)==="+"){
      var pos;
      if(!obj.ldots){
        obj.ldots = repeatDotArray(obj.start, obj.end);
        obj.rdots = repeatDotArray(obj.start, obj.end);
      }
      if(string.charAt(0)==="-"){
        consume(1);
        pos = getStaffPos();
        obj.ldots.splice(obj.ldots.indexOf(pos),1);
        obj.rdots.splice(obj.rdots.indexOf(pos),1);
      } else {
        consume(1);
        pos = getStaffPos();
        obj.ldots = obj.ldots.push(pos);
        obj.rdots = obj.ldots.push(pos);
      }
    }
    return obj;
  }
  return false;
}

function nextNote(){
  var sup = consumeIf(/\^/);
  var obj = new Note;
  obj.rhythm = getRhythm();
  obj.sup = sup;
  obj = getAndSetPitch(obj);
  if(string.length===1 || string.charAt(1)===" "){
    var tails = consumeIf(/[\/]?[+-]*/);
    if(tails){
      obj.forceTail = tails;
    }
  }
  return obj;
}

function nextChantNote(){
  var obj = new ChantNote;
  obj.rhythm = consumeIf(/^[npvl]/);
  obj = getAndSetPitch(obj);
  return obj;
}

function nextCustos(){
  var obj = new Custos();
  consume(1);
  return getAndSetPitch(obj);
}

function nextDot(){
  var obj = new Dot();
  string = string.substring(1);
  // If pitched
  // return getAndSetPitch(obj);
  // Otherwise
  obj.staffPos = getStaffPos();
  return obj;
}

function nextSignumCongruentiae(){
  var obj = new SignumCongruentiae;
  string = string.substring(1);
  obj.staffPos = getStaffPos();
  if(currentChoice) obj.effects =currentChoice;
  return obj;
}

function nextFermata(){
  var obj = new Fermata();
  string = string.substring(1);
  obj.staffPos = getStaffPos();
  return obj;
}

function nextTaglike(){
  var tagend = string.indexOf(">");
  if(tagend == -1){
    return false;
  }
  var tag = string.substring(1, tagend);
  string = string.substring(tagend+1);
  switch(tag){
    case "neume":
      return nextNeume();
    case "lig":
      return nextLigature();
		case "rot180":
			return new upsideDownOpen();
		case "/rot180":
			return new upsideDownClose();
    case "red":
      if(string.indexOf("</red>")==-1){
        complaint.push("Missing close tag for <red> around "+string);
      }
      return new RedOpen();
    case "/red":
      return new RedClose();
    case "large":
      if(string.indexOf("</large>")==-1){
        complaint.push("Missing close tag for <large> around "+string);
      }
      return new LargeOpen();
    case "/large":
      return new LargeClose();
    case "blue":
      if(string.indexOf("</blue>")==-1){
        complaint.push("Missing close tag for <blue> around "+string);
      }
      return new BlueOpen();
    case "/blue":
      return new BlueClose();
    case "redline":
      if(string.indexOf("</redline>")==-1){
        complaint.push("Missing close tag for <red> around "+string);
      }
      return new RedlineOpen();
    case "/redline":
      return new RedlineClose();
    case "void":
      return new VoidOpen();
    case "/void":
      return new VoidClose();
    case "full":
      return new FullOpen();
    case "/full":
      return new FullClose();
		case "tacet":
			var endPos = string.indexOf("</tacet>");
			if(endPos===-1) {
				complaint.push("missing close tag for tacet");
				return false;
			} else { 
				return nextTacet(endPos);
			}
		case "tacet/":
			return new Tacet();
    case "text":
    case "label":
      var thingy = nextText();
      if(thingy){
        thingy.type = tag;
        return thingy;
      }
    default:
      if(tag.substring(0, 4)=="text" || tag.substring(0, 5)=="label"){
        // text with position
        var thing = nextText();
        if(thing){
          enrichText(tag, thing);
          return thing;
        }
      } else if (tag.substring(0, 4)=="part"){
				var thing = nextPart("part", false, tag.substring(5));
        return thing;
      } else if (tag.substring(0, 5)=="/part"){
				return nextPart("part", true, false);
      } else if (tag.substring(0, 4)=="pars"){
				return nextPart("pars", false, tag.substring(5));
      } else if (tag.substring(0, 5)=="/pars"){
				return nextPart("pars", true, false);
      } else if (tag.substring(0, 7)=="section"){
				return nextPart("section", false, tag.substring(8));
      } else if (tag.substring(0, 8)=="/section"){
				return nextPart("section", true, false);
      } else if (tag.substring(0, 9)=="catchword" || tag.substring(0, 9)=="signature"){
        var margType = tag.substring(0, 9);
        var end = string.indexOf("</"+margType+">");
        if(end>-1){
          var os = string.substring(end+12);
          var c = new Catchword();
          c.tag = margType;
          var colon = tag.indexOf(":");
          if(colon>-1) c.position = trimString(tag.substring(colon+1, tagend));
          string = string.substring(0,end);
          c.code = string;
          c.content = readPara();
          string = os;
          return c;
        }
      }
  }
  return false;
}

function nextNeume(){
  var end = string.indexOf("</neume>");
  if(end == -1){
    complaint.push("Unclosed neume at: " + string);
    return false;
  }
  var returnString = string.substring(end+8);
  var neume = new Neume();
  var pitch = false;
  var staffPos = false;
  var strsize = 0;
  var next = false;
  string = string.substring(0,end);
  consumeSpace();
  while(string.length != 0){
    strsize = string.length;
    if(consumeIf("<obl>")){
      next = nextObliqueNeume();
//    } else if(string.substring(0, 6)=="<text>"){
    } else if(consumeIf(/<(text|label):?.*?>/)){
      next = nextText();
    } else if (string.substring(0,2)=="**"){
      next = nextComment();
    } else {
      next = new NeumeItem();
      next.sup = consumeIf("^") ? true : false;
      next.ltail = consumeIf("t") ? true : false;
      next = getAndSetPitch(next);
      next.rtail = consumeIf("t") ? true : false;
    }
    if(next){
      if(next.objType==="TextUnderlay" && neume.members.length
         && typeof(neume.members[neume.members.length-1].text) !==undefined
         && !neume.members[neume.members.length-1].text){
        neume.members[neume.members.length-1].text = next;
      } else {
        neume.members.push(next);
      }
      next = false;
    }
    consumeSpace();
    if(string.length == strsize){
      // stuck in a loop. Break out somehow
      complaint.push("Broken at '"+string.substring(0, 10)
                      +" in neume processing.</br>");
      string = string.substring(1);
    }
  }
  string = returnString;
  return neume;
}

function nextObliqueNeume(){
  var end = string.indexOf("</obl>");
  if(end == -1){
    complaint.push("Please repair unmatched <obl> somewhere near: "+string);
    string = "";
    return false;
  }
  var oblique = new ObliqueNeume();
  var returnString = string.substring(end+6);
  var ni = false;
  var strsize = string.length;
  string = string.substring(0, end);
  consumeSpace();
  while(string.length != 0) {
    if(consumeIf(/<(text|label):?.*?>/)){
      oblique.texts[oblique.members.length-1] = nextText();
    } else if(string.substring(0,2) == "**"){
      oblique.comments[oblique.members.length-1] = nextComment();
    } else if(string.substring(0,1) == "{"){
      // FIXME: do stuff
    } else {
      ni = new NeumeItem();
      ni.ltail = consumeIf("t") ? true : false;
      ni = getAndSetPitch(ni);
      ni.rtail = consumeIf("t") ? true : false;
      oblique.members.push(ni);
    }
    consumeSpace();
    if(string.length == strsize){
      // stuck in a loop. Break out somehow
      complaint.push("Broken at '"+string.substring(0, 10)
                      +" in neume processing.</br>");
      string = string.substring(1);
    }
      strsize = string.length;
  }
  string = returnString;
  return oblique;
}

function nextLigature(){
  var end = string.indexOf("</lig>");
  if(end == -1){
    complaint.push("Please repair somewhere near: "+string);
    string = "";
    return false;
  }
  var brokentest1 = string.search(/<lig>/);
  if(brokentest1!=-1 && brokentest1<end){
    complaint.push("Please repair somewhere near: "+string);
    return false;
  }
  var ligature = new Ligature();
  var returnString = string.substring(end+6);
  string = string.substring(0, end);
  ligature.str = string;
  consumeSpace();
  var strsize = string.length;
  var next = false;
  var prevevent = false;
  var tag;
  while(strsize!=0){
//		console.log(string);
    if((tag=consumeIf(/<(text|label):?.*?>/))){
      //FIXME ignores meaning
      next = nextText();
      enrichText(tag, next);
    } else if(consumeIf("<obl>")){
      next = nextOblique(ligature);
    } else if(string.substring(0,2) == "**"){
      next = nextComment();
//      next = new LigatureComment(next);
      currentExample.comments.push(next);
    } else if(string.charAt(0)=="<") {
      complaint.push("Unexpected item in the tagging area: "+string);
      return false;
    } else if(string.substring(0,5)=="{var="){
      next = nextLigChoice(ligature);
    } else {
      next = nextNote();
      next = new LigatureNote(next);
      if(string.charAt(0)=="."){
        next.dot = nextDot();
      }
      if((string.charAt(0)==="-" && string.charAt(1)==="?") || string.charAt(0)==="?"){
        var flipped = consumeIf("-");
        next.signum = nextSignumCongruentiae();
        next.signum.effects = next;
        next.signum.flipped = flipped;
      }
    }
    if(string.charAt(0)=="."){
      next.dot = nextDot();
    }
    if(next){
//      ligature.members.push(next);
      ligature.addElement(next);
    }
    consumeSpace();
    if(string.length == strsize){
      // stuck in a loop. Break out somehow
      complaint.push("Broken at '"+string.substring(0, 10)
                      +" in ligature processing.</br>");
      string = string.substring(1);
    }
    strsize = string.length;
  }
  string = returnString;
  return ligature;
}

function nextOblique(ligature){
  var end = string.indexOf("</obl>");
  if(end == -1){
    complaint.push("Please repair unmatched <obl> somewhere near: "+string);
    string = "";
    return false;
  }
  var oblique = new Oblique();
  oblique.ligature = ligature;
  var returnString = string.substring(end+6);
  string = string.substring(0, end);
  consumeSpace();
  var strsize = string.length;
  var next = false;
  var tag;
	var prevNote = false;
  while(strsize!=0){
    if((tag=consumeIf(/<(text|label):?.*?>/))){
      oblique.texts[oblique.members.length-1] = nextText();
      enrichText(tag, oblique.texts[oblique.members.length-1]);
    } else if(string.substring(0,2) == "**"){
      var obj = nextComment();
      obj.ligature = oblique.ligature;
      oblique.comments[oblique.members.length-1] = obj;
    } else if(string.substring(0,1) == "{"){
      // FIXME: do stuff
      next = nextObliqueNoteChoice(oblique);
			if(next.subType==="no notes"){
				if(prevNote){
					prevNote.otherBits.push(next);
				} else {
					console.log("broken Ligature", oblique);
				}
			} else {
				oblique.extendMembers(next);
			}
    } else {
      next = nextNote();
      if(next){
        next = new ObliqueNote(next, oblique.members.length, oblique);
        if(string.charAt(0)=="."){
          next.dot = nextDot();
        }
				if((string.charAt(0)==="-" && string.charAt(1)==="?") || string.charAt(0)==="?"){
					var flipped = consumeIf("-");
					next.signum = nextSignumCongruentiae();
					next.signum.effects = next;
					next.signum.flipped = flipped;
				}
        oblique.extendMembers(next);
				prevNote = next;
      }
    }
    consumeSpace();
    if(string.length == strsize){
      string = string.substring(1);
    }
    strsize = string.length;
  }
  string = returnString;
  return oblique;
}
function enrichText(tag, obj){
	// Add info to textlike element based on the element tag
  obj.type = tag.substring(0, 5)==="label" ? "label" : "text";
  var colon = tag.indexOf(":");
  if(colon>-1){
    var tagPart = tag.substring(colon+1).trim();
    if(tagPart.substring(0,3)==="rot"){
      var tagBits = tagPart.substring(3).split(",");
      obj.orientation = tagBits[0].trim();
      obj.position = (tagBits.length>1 ? Number(tagBits[1].trim()) : 
                      (obj.orientation==="90c" ? 12 : 4));
    } else {
      obj.position = tagPart;
    }
  }
}
function nextTacet(endPos){
	// nice and simple. Tacet is a type of text, but is treated
	// differently because it takes up horizontal space.
	var tacet = new Tacet();
	tacet.content = [];
	var content = string.substring(0, endPos);
	var finalString = string.substring(endPos+8);
	var linebreak;
	while ((linebreak = content.indexOf("<l/>"))>-1){
		extendTacet(content.substring(0, linebreak), tacet);
		content = content.substring(linebreak+4);
	}
	extendTacet(content, tacet)
	string = finalString;
	return tacet;
}

function extendTacet(content, tacet){
	var os = string;
	string = content;
	if(/[<{*]/.test(string)){
		var parts = getString();
		if(parts){
			tacet.content.push(parts);
		}
	} else {
		tacet.content.push([string]);
	}
	string = os;
	return tacet;
}

function nextText (){
  var t = string.indexOf("</text>");
  var l = string.indexOf("</label>");
  // This looks complicated, but we want -1 if both are -1, otherwise,
  // we want the one that isn't -1 or the lower of the two otherwise
  var end = ((t >-1 && t<l) || l===-1) ? t : l;
  var taglength = ((t >-1 && t<l) || l===-1) ? 7 : 8;
  if(end === -1){
    return false;
  }
  var text = new TextUnderlay();
  var returnString = string.substring(end+taglength);
  string = string.substring(0, end);
//  text.components = getSubText();
  text.components = getString();
  string = returnString;
  return text;
}

function getSubText (){
  // parse contents of a <text></text> block or equivalently-syntaxed
  // thing (e.g. a variant)
  var components = [];
  var strsize = string.length;
  var next = false;
  var tagpos = string.indexOf("<");
  var commentpos = string.indexOf("**");
  var varpos = string.indexOf("{");
  while(strsize != 0){
    if(varpos!=-1 && (commentpos == -1 || varpos<commentpos) 
       && (tagpos ==-1 || varpos < tagpos)) {
      if(varpos) components.push(string.substring(0,varpos));
      string = string.substring(varpos);
      end = string.indexOf("}");
      if(typeof(spans[string.substring(1, end)])!=="undefined"){
        components.push(getTag("<"+string.substring(1, end)+">"));
        components.push(string.substring(end+1, end+2));
        components.push(getTag("</"+string.substring(1, end)+">"));
        string = string.substring(end+2);
      } else {
//        console.log("fail");
        // FIXME: A variant inside a variant would spell madness, but
        // lets assume sanity for now
        components.push(nextTextChoice());
      }
      // A variant can invalidate more or less anything that follows, so...
      varpos = string.indexOf("{");
      tagpos = string.indexOf("<"); // just to check it wasn't in the comment;
      commentpos = string.indexOf("**");
    } else if(commentpos != -1 && (commentpos < tagpos || tagpos == -1)){
        components.push(string.substring(0,commentpos));
        string = string.substring(commentpos);
        components.push(nextComment());
        varpos = string.indexOf("{");
        tagpos = string.indexOf("<"); // just to check it wasn't in the comment;
        commentpos = string.indexOf("**");
    } else {
      if(tagpos > 0){
        components.push(string.substring(0,tagpos));
        string = string.substring(tagpos);
      } else if (tagpos == -1) {
        components.push(string);
        return components;
      }
      next = getTag(consumeIf(/<[^>]*>/));
      if(next){
        if(next.objType.indexOf("Open") != -1
           // Open tag
           && !next.checkClose()){
          complaint.push("Missing close tag for "+next.objType+" around "+string);
        }
        components.push(next);
      }
      varpos = string.indexOf("{");
      tagpos = string.indexOf("<"); // just to check it wasn't in the comment;
      commentpos = string.indexOf("**");
    }
  }
  return components;
}
function getString (){
  // Parse contents of <text></text> or equivalently-syntaxed thing
  // (e.g. a variant). This is a version of what was previously
  // getSubText, a faster, but much less flexible function
  var content = [];
  var size = string.length;
  var prev = false;
  var next = false;
  var braceEnd = false;
  var currentCloses = false;
  while(string.length >0){
    prev = last(content);
    if(currentCloses && prev!=currentCloses[currentCloses.length-1][0]){
      // we have a self closing tag and a new thing after it
      // FIXME: should probably check what's been added
      for(var i=0; i<currentCloses.length; i++){
        content.push(currentCloses[i][1]);
      }
      currentCloses = false;
      prev = last(content);
    }
    switch(string.charAt(0)){
      case "<":
        next = getTag(consumeIf(/<[^<]*>/));
        content.push(next);
        break;
      case "{":
        var closePos = Math.min(string.indexOf("}"), string.length);
        var tag = string.substring(1, closePos);
        if (tag==="|"){
          content.push(new MusicWordSplit());
          consume(closePos+1);
        } else if (tag==="_"){
          content.push(new MusicWordJoin());
          consume(closePos+1);
        } else if (tag===" "){
          content.push(new MusicOptionalSpace());
          consume(closePos+1);
        } else if(tag.length===2 && /[,.¶:;()–\-\—!?\ ‘’]+/.test(tag)){
          content.push(new MusicPunctuation(tag));
          consume(closePos+1);
        } else if(typeof(spans[tag])!=="undefined"){
          next = getTag("<"+tag+">");
          content.push(next);
          if(!currentCloses) currentCloses = [];
          currentCloses.push([next, getTag("</"+tag+">")]);
          consume(closePos+1);
        } else if (string.substring(1, 4)==="var") {
          content.push(nextTextChoice());
        } 
        break;
      case "^":
        content.push(getMusicTextSup());
        break;
      case "*":
        var commentBlock = consumeIf(/\*\*[^*]*\*\*/);
        if(commentBlock){
          next = new Comment();
          next.content = commentBlock.substring(2, commentBlock.length-2);
          currentExample.comments.push(next);
          content.push(next);
          continue;
        }
        // If it isn't a comment, it's part of a string, so continue
      default:
        if(prev && typeof(prev)==="string"){
          content[content.length-1] = prev + string.charAt(0);
        } else {
          content.push(string.charAt(0));
        }
        consume(1);
        break;
    };
    if(string.length === size){
      console.log("Stuck: ", string);
      if(prev && typeof(prev)==="string"){
        content[content.length-1] = prev + string.charAt(0);
      } else {
        content.push(string.charAt(0));
      }
      consume(1);
    }
    size = string.length;
  }
  return content;
}
function getMusicTextSup(){
  var el = new MESuper()
  consume(1);
  var end = string.indexOf("^");
  var end2 = string.indexOf(" ");
  var newString, newPointer;
  if(end2!==-1 && (end===-1 || end2<end) && end2<8){
    newString = string.substring(end2);
    newPointer = pointer+end2;
    string = string.substring(0, end2);
  } else if(end===-1 || end>8){
    // no "^" or " " or "^" is far removed
    if(string.length){
      newString = string.substring(1);
      newPointer = pointer+1;
      string = string.substring(0, 1);
    } else {
      return;
    }
  } else {
    newString = string.substring(end+1);
    newPointer = pointer+end;
    string = string.substring(0,end);
  }
  el.text = string;
  string = newString;
  pointer = newPointer;
  return el;
}

function getTag (tag){
  switch(tag){
    case "<red>":
      return new RedOpen();
    case "</red>":
      return new RedClose();
    case "<blue>":
      return new BlueOpen();
    case "</blue>":
      return new BlueClose();
    case "<redline>":
      return new RedlineOpen();
    case "</redline>":
      return new RedlineClose();
    case "<strikethrough>":
      return new StrikethroughOpen();
    case "</strikethrough>":
      return new StrikethroughClose();
    case "<large>":
      return new LargeOpen();
    case "</large>": 
      return new LargeClose();
    default:
      if(tag.charAt(1)==="/"){
        var obj = new GenericClose();
        obj.tag = tag.substring(2, tag.length-1);
      } else {
        var obj = new GenericOpen();
        obj.tag = tag.substring(1, tag.length-1);
      }
      return obj;
  }
}

function consumeParenthesis(){
  var openchar = string.charAt(0);
  //FIXME: assuming sanity
  var closechar = openchar == "{" 
                    ? "}" 
                    : openchar == "(" 
                        ? ")" 
                        : openchar == "<" ? ">" :
                            openchar == "[" ? "]" : false;
  if(!closechar) return false;
  var score = 1;
  for(var i=1; i<string.length; i++){
    if(string.charAt(i) == openchar) {
      score++;
    } else if(string.charAt(i) == closechar){
      score--;
      if(score == 0){
        var paren = string.substring(0, i+1);
        string = string.substring(i+1);
        return paren;
      }
    }
  }
  return false;
}

function parseMens(spec){
  var obj = new MensuralSignature();
  var pointer = 0;
  if(!spec || !spec.length) return obj;
	if(spec.charAt(0) == "(") {
		obj.invisible=true;
		pointer++;
	}
  if(spec.charAt(0) == "[") {
    obj.editorial=true;
    pointer++;
  }
  if(spec.charAt(spec.length-1)=="]" || spec.charAt(spec.length-1)==")") spec = spec.substring(0, spec.length-1);
  if(spec.charAt(pointer)==="^"){
    obj.sup = true;
    pointer++;
  }
  if(spec.charAt(pointer)) {
		var tempspec = spec.substring(pointer+1);
		if(/^[2-9][0-9]/.test(tempspec)) {
			obj.signature = spec.substring(pointer, pointer+2);
			pointer++;
		} else {
			obj.signature = spec.charAt(pointer);
		}
  } else return obj;
  pointer++;
  if(spec.charAt(pointer)) {
    obj.staffPos = staffPosFromString(spec.substring(pointer))[0];
  }
  return obj;
}

function parseMensReading(fields){
  var mens, wits;
  var signature = false;
  if(fields[0] === "(om.)"){
    mens = new MensuralSignature();
  } else if(fields[0].length>1){
    mens = parseMens(fields[0].substring(1, fields[0].length-1));
  } else{
    // This is an error. See if a blank works as a recovery strategy
    mens = new MensuralSignature();
  }
  for(var i=1; i<fields.length; i++){
    if(fields[i].charAt(0) === '"' || fields[i].substring(0, 3) === '(om'){
			wits = fields.slice(1, i);
      return [fields.slice(i), new MReading(wits, [mens], "", false, staffDetailsForWitnesses(wits), false)];
    } 
  }
  wits = fields.slice(1, fields.length);
  if(fields[0]==="(om.)"){
    return [false, new MOmission(wits, "om.", false, staffDetailsForWitnesses(wits))];
  } else {
    return [false, new MReading(wits, [mens], false,
                               false, staffDetailsForWitnesses(wits))];
  }
}
function parseMensVar(fields){
  var obj = new MChoice();
  var nextM = parseMensReading(fields);
	nextM.choice = obj;
  fields = nextM[0];
  while(fields){
    obj.content.push(nextM[1]);
    nextM = parseMensReading(fields);
		nextM.choice = obj;
    fields = nextM[0];
  }
  obj.content.push(nextM[1]);
  return obj;
}

function parseProp(propSpec, posSpec){
  var propStrings = propSpec.split('/');
  var propPositions = posSpec.split('-');
  var obj, child;
  if(propStrings.length===1){
    obj = new ProportionSign();
    obj.sign = propStrings[0];
    obj.staffPos = staffPosFromString(propPositions[0])[0];
  } else {
    if (propStrings.length>2 || propStrings.length===0){
      console.log("Stack of "+propStrings.length+" proportion signs!!", propSpec);
    }
    obj = new StackedProportionSigns();
    for(var i=0; i<propStrings.length; i++){
      child = new ProportionSign();
      child.sign = propStrings[i];
      child.staffPos = staffPosFromString(propPositions[propStrings.length-1-i])[0];
      obj.signs.push(child);
    }
  } 
  return obj;
}

function parseSolm(signs){
  var solm, pitch, nextChar;
  var obj = new SolmizationSignature();
  if(!signs[0] || signs[0] === "0" || signs[0] === '"0"') return obj;
  for(var i=0; i<signs.length; i++){
    nextChar = 0;
    solm = new SolmizationSign();
    if(signs[i].charAt(0) == "^") {
      solm.sup = true;
      nextChar++;
    }
    solm.symbol = signs[i].charAt(nextChar);
    nextChar++;
    pitch = signs[i].substring(nextChar);
    if(/([A-g])\1{0,2}/.exec(pitch)){
      // This really is a pitch
      solm.pitch = pitch;
    } else {
      // staffpos
      // solm.staffPos = "0123456789ABCDEF".indexOf(signs[i].charAt(nextChar));
      solm.staffPos = staffPosFromSTring(signs[i].substring(nextChar))[0];
    }
    if(solm.pitch || solm.staffPos != -1){
      obj.members.push(solm);
    }
  }
  return obj;
}
function parseSolmReading(fields){
  var solm=false, closed, signs=[], start, finish, last, from, descr="", field;
  for(var i=0; i<fields.length; i++){
    field = fields[i];
    if(field.charAt(0)==='"'){
      // Starting a solm sig
      if(from && (solm || i-from)){
				var wits = fields.slice(from, i);
        var staffing = staffDetailsForWitnesses(wits);
        return [fields.slice(i), 
                new MReading(fields.slice(from, i), solm ? [solm] : [], descr, false, staffing)];
      } else {
        if(field.charAt(field.length-1)==='"'){
          solm = parseSolm([field.substring(1, field.length-1)]);
          closed = true;
          from = i+1;
        } else {
          signs.push(field.substring(1));
          from = i+1;
        }
      }
    } else if (fields[i].charAt(0)==='('){
      // starting a descr
      if(from && ((solm && i-from) || descr.length)){
				var wits = fields.slice(from, i);
        var staffing = staffDetailsForWitnesses(wits);
        return [fields.slice(i),
                new MReading(fields.slice(from, i), solm ? [solm] : [], descr, false, staffing)];
      } else {
        // relevant description
        finish = field.lastIndexOf(')');
        descr = field.substring(1, finish > -1 ? finish : field.length);
        from = i+1;
      }
    } else if (!closed){
      finish = field.lastIndexOf('"');
      if(finish>-1){
        signs.push(field.substring(0, finish));
        closed = true;
        solm = parseSolm(signs);
        from = i+1;
      } else {
        signs.push(field);
        from = i+1;
      }
    } else {
      // Witnesses. Do nothing
    }
  }
	var wits = fields.slice(from, i);
  var staffing = staffDetailsForWitnesses(wits);
  return [false, new MReading(fields.slice(from), solm ? [solm] : [], descr, false, staffing)];
}

function parseSolmVar(fields){
  var next = false;
  var obj = new MChoice();
  var nextS = parseSolmReading(fields);
  fields = nextS[0];
  while(fields){
    obj.content.push(nextS[1]);
    nextS = parseSolmReading(fields);
    fields = nextS[0];
  }
  obj.content.push(nextS[1]);
  return obj;
}

function parseClefReading(fields){
  var clef = false, descr="", from=false, finish;
  for(var i=0; i<fields.length; i++){
    if(fields[i].charAt(0) =='"'){
      if(from && (clef || i-from)){
        // either we've got a clef for this reading, or there is none
        // (and so there has been at least one witness listed)
        var wits = fields.slice(from, i);
        var staffing = staffDetailsForWitnesses(wits);
        // console.log(staffing);
        return [fields.slice(i), new MReading(fields.slice(from, i), clef ? [clef] : [], descr, false, staffing)];
      } else {
        // Clef for this reading
        finish = fields[i].lastIndexOf('"');
        if(!finish && (fields[i+1].charAt(0)=="[" || fields[i+1].charAt(0)=="^")){
          // Erroneous clef, specified in form "C6 [C8]"
          
          finish = fields[i+1].lastIndexOf('"');
          clef = parseClef(fields[i].substring(1)+" "
                           + (finish>-1 ? fields[i+1].substring(0,finish) : fields[i+1]));
          from = i+2;
        } else {
          clef = parseClef(fields[i].substring(1, finish ? finish : fields[i].length));
          from = i+1;
        }
      }
    } else if(fields[i].charAt(0)==='('){
      if(from && ((clef && i-from) || descr.length)) {
        // this either doesn't apply to the clef or there's already a
        // description
        var wits = fields.slice(from, i);
        var staffing = staffDetailsForWitnesses(wits);
        // console.log(wits);
        return [fields.slice(i), new MReading(fields.slice(from, i), clef ? [clef] : [], descr, false, staffing)];
      } else {
        // relevant description
        finish = fields[i].lastIndexOf(')');
        descr = fields[i].substring(1, finish > -1 ? finish : fields[i].length);
        from = i+1;
      }
    }
  }
  var wits = fields.slice(from, fields.length);
  var staffing = staffDetailsForWitnesses(wits);
  // console.log(wits);
  return [false, new MReading(fields.slice(from, fields.length), clef ? [clef] : [], descr, false, staffing)];
}

// function parseClefReading(fields){
//   var clef = parseClef(fields[0].substring(1, fields[0].length-1));
//   for(var i=1; i<fields.length; i++){
//     if(fields[i].charAt(0) =='"'){
//       return [fields.slice(i), new MReading(fields.slice(1, i), [clef], "")];
//     }
//   }
//   return [false, new MReading(fields.slice(1, fields.length), [clef], "")];
// }
function parseClefVar(fields){
  var obj = new MChoice();
  var nextC = parseClefReading(fields);
  fields = nextC[0];
  while(fields){
    obj.content.push(nextC[1]);
    nextC = parseClefReading(fields);
    fields = nextC[0];
  }
  obj.content.push(nextC[1]);
  currentClef = obj.content[0].content[0];
  return obj;
}
function parseClef(spec, sub){
  if(!spec || spec === "0") return false;
  // FIXME: Why??
  var old = currentClef;
  var obj = new Clef();
  currentClef = old; //Just in case isn't valid
  var clefs = /^(Gamma|C|F|G|E)/;
  var r;
  if(spec.charAt(0)=="(") {
		obj.invisible = true;
		spec = spec.substring(1);
		if(spec.charAt(spec.length-1)===")") spec = spec.substring(0, spec.length-1);
	}
  if(spec.charAt(0)=="[") {
    obj.editorial=true;
    spec = spec.substring(1);
  } else {
    // Re-enabled 12/14. Not sure what effect commenting this'll have
    // if(sub) return false;
  }
  if(spec.charAt(spec.length-1)=="]") spec = spec.substring(0, spec.length-1);
	if(spec.charAt(0)=="l") {
		obj.literal=true;
		spec = spec.substring(1);
	}
  r = clefs.exec(spec);
  if(!r) return false;
  obj.type = r[0];
  if(!obj.type) return false;
  spec = spec.substring(obj.type.length);
  if(!spec.length) return false;
//  obj.type = spec.substring(0, spec.length - 1);
//  obj.staffPos = "0123456789ABCDEF".indexOf(spec.charAt(spec.length - 1));
  // obj.staffPos = "0123456789ABCDEF".indexOf(spec.charAt(0));
  // if(obj.staffPos===-1) return false;
  // spec = spec.substring(1);
  var pos = staffPosFromString(spec);
  if(!pos) return false;
  spec = spec.substring(pos[1]);
  obj.staffPos = pos[0];
  var p = obj.staffPos;
  var anotherBit = spec.search(/\S/);
  if(anotherBit>-1){
//    console.log("clef has extra '"+spec+"'", anotherBit, spec.substring(anotherBit));
    if(spec.charAt(anotherBit)==="^"){
      obj.stackedClefs.push(parseClef(spec.substring(anotherBit+1), true));
    } else { 
      // Is an erroneous (and corrected) clef)
      obj.erroneousClef=parseClef(spec.substring(anotherBit), true);
      // HACK: new Clef adds a spurious clef to MusicExample.staves, so let's undo that
      currentExample.staves.pop();
    }
  }
  currentClef = obj;
  return obj;
}

function parseStaff(spec){
  var staff = new Staff;
  currentExample.staves.push([currentExample.events.length, staff]);
  var pointer = 0;
  var wit = [];
  var val;
  // First: lines
  if(spec[0].charAt(0)=='"'){
    staff.lines = new ValueChoice();
    while(pointer< spec.length && !colourp(spec[pointer])){
      val = linesp(spec[pointer]);
      pointer++;
      while(pointer< spec.length && !linesp(spec[pointer]) && !colourp(spec[pointer])){
        var os = string;
        string = spec[pointer];
        wit.push(consumeWitnesses()[0]);
        string = os;
        // wit.push(spec[pointer]);
        pointer++;
      }
      staff.lines.addReading(wit, val, false);
      wit = [];
    }
  } else if(!isNaN(parseInt(spec[0],10))){
    // No variant
    staff.lines = linesp(spec[0]);
    pointer++;
  }
  // now colour
  if(pointer>=spec.length){
//    staff.colour = defaultColour;
  } else if (spec[pointer].charAt(0)=='"'){
    staff.colour = new ValueChoice();
    while(pointer < spec.length){
      val = colourp(spec[pointer]);
      pointer++;
      while(!colourp(spec[pointer])){
        var os = string;
        string = spec[pointer];
        wit.push(consumeWitnesses()[0]);
        string = os;
        // wit.push(spec[pointer]);
        pointer++;
      }
      staff.colour.addReading(wit, val, false);
      wit = [];
    }    
  } else {
    // No variant
    staff.colour = colourp(spec[pointer]);
  }
//  console.log(staff);
  return staff;
}
function linesp(string){
  return (!isNaN(parseInt(string)) && parseInt(string))
    || 
    (!isNaN(parseInt(string.substring(1, string.length-1)))
      && parseInt(string.substring(1, string.length-1)));
}
function colourp(string){
  return string.match(/(black|red|blind|0)/) ? string.match(/(black|red|blind|0)/)[0] : false;
}

function nextPart(partType, closes, extra){
	// This covers Part, pars and other boundaries in the flow. N.B. The
	// <Part> object represents the tag, not the element (i.e. there is
	// an open at the beginning and a close at the end, and nothing is
	// 'contained')
	var thing = new Part();
	//	if(partType!="part")
	thing.type = partType;
	if(closes) {
		// A close tag can't have any other information
		thing.closes=true;
		return thing;
	}
	var oldString = string;
	string = extra;
	// Format information for the text can be added, but only makes
	// sense for single-source transcriptions. If we change our mind
	// about this, and want to allow this info in variants, then the
	// block that follows will need to be wrapped in the one after that.
	var info = consumeIf(/\s*\{[^}v]*\}\s*/);
	if(info) {
		innerInfo = /{([^}]*)}/.exec(info)[1];
		bits = /([^,\s]*)[,\s]*([^,\s]*)[,\s]*(.*)/.exec(innerInfo);
		for(var i=1; i<4; i++){
			if(bits[i].length){
				if(!isNaN(parseInt(bits[i]))){
					// This is positional info (goes with rotation component)
					thing.position = parseInt(bits[i]);
				} else if(bits[i].substring(0,3)==="rot"){
					// The label is rotated
					thing.orientation = bits[i].substring(3);
					if(!thing.position) thing.position = thing.orientation==="90c" ? 12 : 4;
				} else {
					// colour or other presentational material
					thing.style += " "+bits[i];
				}
			}
		}
	}
	extra = string;
	string = oldString;
	// Part names/numbers can be per-source (i.e. for variants), so
	// there may be need for a 'choice' structure
	if(extra){
		if(/{+/.test(extra) || /\*\*/.test(extra)){
			// this is serious - we have full-blown critical apparatus stuff here
			oldString = string;
			string = extra;
			thing.id = getString();
			string = oldString;
		} else if(/\s*"/.test(extra) || extra.indexOf("(om")>-1){
			// variants are present
			var obj = new MChoice();
			obj.subType = "part";
			var bits = extra.match(/[^{} :=]+/g);
			var nextPart = nextPartnameReading(bits, partType, closes, obj);
			bits = nextPart[0];
			while(bits){
				obj.content.push(nextPart[1]);
				nextPart = nextPartnameReading(bits, partType, closes, obj);
				bits = nextPart[0];
			}
			obj.content.push(nextPart[1]);
			return obj;
//			thing.id = extra;
		} else {
			thing.id = extra.trim();
		}
	}
	return thing;
}

function nextPartnameReading(fields, partType, closes, choice){
	var part = new Part();
	var om = true;
	part.type = partType;
	if(fields[0].length>1 && fields[0] !== "(om.)"){
		om = false;
	} 
	if(closes) part.closes=true;
	for(var i=1; i<fields.length; i++){
    if(fields[i].charAt(0) === '"' || fields[i].substring(0, 3) === '(om'){
			if(om) {
				return [fields.slice(i), new MOmission(fields.slice(1, i), "om",
																							 false, staffDetailsForWitnesses(fields.slice(1, i)), choice)];
			} else {
				var value = fields[0].match(/[^"]+/)[0];
				part.id = value;
				return [fields.slice(i), new MReading(fields.slice(1, i), [part],
																							false, false, staffDetailsForWitnesses(fields.slice(1, i)), choice)];
			}
		}
	}
	if(om){
		return [false, new MOmission(fields.slice(1), "om",
																 false, false, staffDetailsForWitnesses(fields.slice(1)), choice)];
	} else {
		part.id = fields[0].match(/[^"]+/)[0];
		return [false, new MReading(fields.slice(1), [part],
																false, false, staffDetailsForWitnesses(fields.slice(1)), choice)];
	}
}

function nextInfo(){
  var info = consumeParenthesis();
  var obj = false;
  if(info){
    var fields = info.match(/[^{}, :=]+/g);
    switch(fields[0]){
    case "mens":
      if(fields[1] && fields[2] && 
         (fields[1].charAt(0)==='"' || fields[2].charAt(0)==='"' ||
          fields[1].substring(0, 2)==='(o')){
        return parseMensVar(fields.slice(1));
      } else if(fields[1].length==2){
        // new format
        var mens = parseMens(fields[1]);
        if(fields.length>2 && fields[2].charAt(0)==="^") mens.sup = parseMens(fields[2]);
        return mens;
      } else if(fields.length>1){
        return parseMens(fields[1], fields[2]);
      } else {
        return false;
      }
    case "prop":
      if(fields[1] && fields[2] && 
         (fields[1].charAt(0)==='"' || fields[2].charAt(0)==='"' ||
          fields[1].substring(0, 2)==='(o')){
        return parsePropVar(fields.slice(1));
      } else if(fields[1].length==2){
        var prop = parseProp(fields[1], fields[2]);
        return prop;
      } else if(fields.length>1){
        return parseProp(fields[1], fields[2]);
      } else {
        return false;
      }        
    case "solm":
      if(fields[1].charAt(0)=='"'){
        return parseSolmVar(fields.slice(1));
      } else return parseSolm(fields.slice(1));
    case "clef":
      if(fields.length>2){
        if(fields[1]=="var") {
          return parseClefVar(fields.slice(2));
        } else if (fields[1].charAt(0) == '"'){
          return parseClefVar(fields.slice(1));
        } else if (fields[2].charAt(0)=== '^'){
          //stacked clefs
          var clef = parseClef(fields[1]);
          for(var i=2; i<fields.length; i++){
            clef.stackedClefs.push(parseClef(fields[i].substring(1)));
          }
          return clef;
        } else if(fields[2].charAt(0)==='['){
          var clef = parseClef(fields[1]);
          clef.erroneousClef = parseClef(fields[2]);
          currentExample.staves.pop();
          currentClef = clef;
          return clef;
        }
        return parseClef("C8");
      }
      return parseClef(fields[1]);
    case "staf":
      return parseStaff(fields.slice(fields[1]=="var" ? 2 : 1));
    case "mensural":
    case "plainchant":
      obj = new Notation();
      obj.type = fields[0];
      obj.subtype = fields[1];
      return obj;
    case "newexample":
      obj = new ExampleBreak();
      currentExample.exampleBreaks.push(obj);
      obj.exampleno = exampleno++;
      currentExample.atClass += "/"+obj.exampleno;
      return obj;
    }
  }
  return false;
}    

function nextChoice(){
  return nextChoiceLikeThing(new MChoice(), false);
}

function nextTextChoice(){
  return nextChoiceLikeThing(new MChoice(), true);
}

function nextLigChoice(parent){
  var choice = new LigChoice();
  choice.ligature = parent;
  nextChoiceLikeThing(choice, false);
	if(choice.content.length && choice.content[0] && choice.content[0].content && choice.content[0].content.length===1 && choice.content[0].content[0].objType==="SignumCongruentiae"){
		choice.subType = "SignumCongruentiae";
	}
	return choice;
}

function nextObliqueNoteChoice(parent){
  var choice = new ObliqueNoteChoice();
  choice.ligature = parent.ligature;
  choice.oblique = parent;
	//  return nextChoiceLikeThing(choice, false);
	nextChoiceLikeThing(choice, false);
	var justNotes = true;
	var anyNotes = false;
	var newPrevNote = false;
	for(var i=0; i<choice.content.length; i++){
		newPrevNote = false;
		if(!choice.content[i].content) continue;
		for(var j=0; j<choice.content[i].content.length; j++){
			if(choice.content[i].content[j].objType==="ObliqueNote"){
				anyNotes = true;
				newPrevNote = choice.content[i].content[j]
			} else {
				justNotes = false;
				if(choice.content[i].content[j].objType==="SignumCongruentiae"){
					// console.log("s.c. in a variant in an oblique");
					choice.content[i].content[j].ligature = parent.ligature;
				} else {
					console.log("Unexpected item in oblique ligature area:", choice, choice.content[i].content[j]);
				}
			} 
		}
	}
	if(justNotes) {
		choice.subType = "notes only";
	} else if (!anyNotes){
		choice.subType = "no notes";
	}
	return choice;
}

function nextChoiceLikeThing(choice, textp){
  // cf readChoice in parser.js
  var lDescription, readingString, rDescription, description;
  var witnesses, staffing, agreedVersion, stringTemp;
  var locend = findClose("}", 1);
  var finalString = string.substring(locend+1);
  var clef = currentClef;
  var prevLength = false;
  string = string.substring(5, locend); // 5 because of "{var="
  consumeSpace();
  currentChoice = choice;
  while(string.length && prevLength != string.length){
    if(string.length>15 && book===1&&chapter===3) debug1 = false;
    prevLength = string.length;
    lDescription = consumeDescription();
    readingString = consumeReadingString();
    rDescription = consumeDescription();
    description = lDescription || rDescription;
    witnesses = consumeWitnesses();
    staffing = staffDetailsForWitnesses(witnesses);
    agreedVersion = stavesAgree(staffing);
    stringTemp = string;
    string = readingString;
    switch(description){
      case "nil":
        choice.addNilReading(witnesses);
        break;
      case "ins.":
        // Now what?
        if(textp){
          choice.addTextReading(witnesses, string, description);
        } else {
          choice.addReading(witnesses, string, lDescription, rDescription, staffing);
        }
        currentClef = clef;
        break;
      case "om.":
      case "transp.":
      case "transp. and expanded":
        choice.addOmission(witnesses, lDescription, rDescription, staffing);
        break;
      default:
        if(textp){
          choice.addTextReading(witnesses, string, description);
        } else {
          choice.addReading(witnesses, string, lDescription, rDescription, staffing);
        }
        currentClef = clef;
        break;
    }
    string = stringTemp;
  }
  currentClef = clef;
  string = finalString;
  currentChoice = false;
  return choice;
}

function nextChoiceLikeThing2(choice, textp){
  // Based on readChoice in parser.js
  //var locend = string.indexOf("}");
  var locend = findClose("}", 1);
  var finalString = string.substring(locend+1);
  var readingString, reading, witnesses, quoteloc, braceloc, description, description1, description2, stringTemp, nd, extras;
  var clef = currentClef;
  var prevLength = false;
  string = string.substring(5, locend); // 5 because of "{var="
  while(string.length && prevLength != string.length){
    prevLength = string.length;
    quoteloc = string.indexOf('"');
    braceloc = string.indexOf('(');
    if(braceloc != -1 && (braceloc < quoteloc || quoteloc==-1)){
      string = string.substring(braceloc);
      // this clause begins with an editorial comment
//      description = consumeIf(/\(.*?\)/).slice(1, -1);
      description = consumeTillClose(")", 1).slice(1, -1);
    } else {
      description = false;
    }
    description1 = description;
    consumeSpace();
    if(quoteloc != -1){
      string = string.substring(string.indexOf('"'));
      // readingString = consumeIf(/\".*?\"/).slice(1,-1);
      readingString = consumeTillClose('"', 1).slice(1, -1);
    } else {
      readingString = false;
    }
    consumeSpace();
    witnesses = consumeTillOption([':', '}'], 0);
    // But the brace at the end may already have been removed, so
    if(witnesses) {
      witnesses = witnesses.slice(0, -1);
    } else {
      // This is the bit before the }
      witnesses = consumeN(string.length);
    }
    witnesses = trimString(witnesses);
    witnesses = witnesses.split(/\s+/);
    var staffing = staffDetailsForWitnesses(witnesses);
    var agreedVersion = stavesAgree(staffing);
    consumeSpace();
    stringTemp = string;
    string = readingString;
    switch(description){
      case "nil":
        choice.addNilReading(witnesses);
        break;
      case "ins.":
        // Now what?
        if(textp){
          choice.addTextReading(witnesses, string, description);
        } else {
          choice.addReading(witnesses, string, description, false, staffing);
        }
        currentClef = clef;
        break;
      case "om.":
        choice.addOmission(witnesses, description, false, staffing);
        break;
      default:
        if(textp){
          choice.addTextReading(witnesses, string, description);
        } else {
          choice.addReading(witnesses, string, description, false, staffing);
        }
        currentClef = clef;
        break;
    }
    string = stringTemp;
  }
  currentClef = clef;
  string = finalString;
  return choice;
}

function nextMusic(parent){
  var results = [];
  var length = false;
  var next, prev, augmented;
  //console.log(parent);
  if(!string.length && hackedString) {
    // This hack counteracts a weird disappearing string in .addReading
    string = hackedString;
  }
  consumeSpace();
  while(string.length >0){
    length = string.length;
    next = nextEvent();
    if(next){
      if(prev){
        prev.next = next;
        next.previous = prev;
      }
      if(next.objType==="SolmizationSignature"
         && results.length && results[results.length-1].objType==="Clef"){
        results[results.length-1].solm = next;
      }
      if(parent){
        next = parent.enrichEvent(next, results);
      }
      if(next) {
        if(next.objType=="Dot"){
          next.augments = augmented;
        } else if(next.objType=="Fermata"){
          next.lengthens = augmented;
        } else if(next.objType==="SignumCongruentiae"){
//          console.log(currentChoice, this.events[this.events.length-1]);
          if(currentChoice){
            next.effects = currentChoice;
          } else {
            next.effects = this.events[this.events.length-1];
          }
        } else if (next.objType==="Comment" && this.events.length && 
                   this.events[this.events.length-1].objType==="Ligature"){
          var c = new LigatureComment(next);
          currentExample.comments.push(c);
          this.events[this.events.length-1].members.push(c);
          // I think this is necessary because otherwise we get two
          // comments -- a ligature comment and a normal comment
          next = c;
          prev = next;
          continue;
          //
        } 
        results.push(next);
      }
    } else if(length == string.length){
      // We're stuck in a loop. Try to escape
      string = string.substring(1);
    }
    augmented = consumeSpace() ? false : next;
  }
  return results;
}

function getParameters(){
  var param = new Parameters();
  if(string.indexOf(">") != -1){
    // FIXME: DOOM!
		if(!standaloneEditor){
			param.spec = consumeIf(/\s*{[^}]*}\s*/);
			if(!param.spec){ // old format without braces
				param.spec = consumeIf(/[^,]*/);      
			} else {
				param.spec = param.spec.slice(1, -1);
			}
			param.specComment = new Comment();
			param.specComment.content = param.spec;
			//    param.specComment.commentStyle = "#A6F";
			currentExample.comments.push(param.specComment);
			consumeIf(/\s*,\s*/);
		} else {
			param.specComment = false;
		}
    var next = nextInfo();
    while(next){
      if(Array.isArray(next)){
        param.notation = next[0];
        param.notationSubtype = next[1];
      } else {
        switch(next.objType){
          case "Notation":
            param.notation = next.type;
            param.notationSubtype = next.subtype;
            break;
          case "MensuralSignature":
            param.mensuralSignature = next;
            break;
          case "SolmizationSignature":
            param.solmization = next;
            break;
          case "Clef":
            param.clef = next;
            break;
          case "Staff":
            param.staff = next;
            break;
        }
      }
      consumeIf(/\s*,\s*/);
      next = nextInfo();
    }
  }
  string = string.substring(string.indexOf(">")+1);
  return param;
}
