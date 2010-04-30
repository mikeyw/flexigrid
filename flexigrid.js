/*
 * Flexigrid for jQuery - New Wave Grid
 *
 * Copyright (c) 2008 Paulo P. Marinas (webplicity.net/flexigrid)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * $Date: 2008-07-14 00:09:43 +0800 (Tue, 14 Jul 2008) $
 */

(function($){

    $.addFlex = function(t,p)
    {

        if (t.grid) return false; //return if already exist

        // apply default properties
        p = $.extend({
             height: 200, //default height
             width: 'auto', //auto width
             striped: true, //apply odd even stripes
             novstripe: false,
             minwidth: 30, //min width of columns
             minheight: 80, //min height of columns
             resizable: true, //resizable table
             colresizable: false,
             reorderable: false, //All columns to be moved
             url: false, //ajax url
             method: 'POST', // data sending method
             dataType: 'xml', // type of data loaded
             errormsg: 'Connection Error',
             usepager: false, //
             nowrap: true, //
             page: 1, //current page
             total: 1, //total pages
             useRp: true, //use the results per page select box
             rp: 15, // results per page
             rpOptions: [10,15,20,25,40],
             title: false,
             pagestat: 'Displaying {from} to {to} of {total} items',
             pagetext: 'Page',
             outof: 'of',
             findtext: 'Find',
             procmsg: 'Processing, please wait ...',
             query: '',
             qtype: '',
             nomsg: 'No items',
             minColToggle: 1, //minimum allowed column to be hidden
             showToggleBtn: false, //show or hide column toggle popup
             hideOnSubmit: true,
             autoload: false,
             blockOpacity: 0.5,
             onToggleCol: false,
             onChangeSort: false,
             onSuccess: false,
             debug: true,
             onError: false,
             onSubmit: false, // using a custom populate function
                         prepareRequest: false // Could be used do modify the request data send to target with ajax method.
          }, p);


        $(t)
        .show() //show if hidden
        .attr({cellPadding: 0, cellSpacing: 0, border: 0})  //remove padding and spacing
        .removeAttr('width') //remove width properties
        ;

        //create grid class
        var g = {
            hset : {},
            data_downloaded: {},
            rePosDrag: function () {
                var cdleft = 0 - this.hDiv.scrollLeft;
                  if (this.hDiv.scrollLeft > 0) {
                    cdleft -= Math.floor(p.cgwidth / 2);
                  }
                  $(g.cDrag).css({top:g.hDiv.offsetTop + 1});
                  var cdpad = this.cdpad;

                  if (p.colresizable){
                      // Select all possible drags and hide it. The selection is stored to a variable because
                      // we will reuse it later while iterate through the header cells.
                      var qdrags = $('div', g.cDrag);
                      qdrags.hide();
            
                      // We do not use the regular each method of jQuery because we do need the index of the
                      // header cell for other operation with the drags.
                      var qheaders = $('thead tr:first th:visible', this.hDiv);
                      for (var n = 0; n < qheaders.length; n++) {
                          var cdpos = parseInt($('div', qheaders[n]).width());
                          if (cdleft == 0) {
                              cdleft -= Math.floor(p.cgwidth / 2);
                          }
                          cdpos = cdpos + cdleft + cdpad;
                          // Select the drag which is equals to the index of the current header cell.
                          $(qdrags[n]).css('left', cdpos + 'px').show();
                          cdleft = cdpos;
                       }
                  }
            },
            fixHeight: function (newH) {
                newH = false;
                if (!newH) newH = $(g.bDiv).height();
                var hdHeight = $(this.hDiv).height();
                $('div',this.cDrag).each(
                    function ()
                        {
                            $(this).height(newH+hdHeight);
                        }
                );

                var nd = parseInt($(g.nDiv).height());

                if (nd>newH)
                    $(g.nDiv).height(newH).width(200);
                else
                    $(g.nDiv).height('auto').width('auto');

                $(g.block).css({height:newH,marginBottom:(newH * -1)});

                var hrH = g.bDiv.offsetTop + newH;
                if (p.height != 'auto' && p.resizable) hrH = g.vDiv.offsetTop;
                $(g.rDiv).css({height: hrH});

            },
            dragStart: function (dragtype,e,obj) { //default drag function start

                if (dragtype=='colresize') //column resize
                    {
                        $(g.nDiv).hide();$(g.nBtn).hide();
                        var n = $('div',this.cDrag).index(obj);
                        var ow = $('th:visible div:eq('+n+')',this.hDiv).width();
                        $(obj).addClass('dragging').siblings().hide();
                        $(obj).prev().addClass('dragging').show();

                        this.colresize = {startX: e.pageX, ol: parseInt(obj.style.left), ow: ow, n : n };
                        $('body').css('cursor','col-resize');
                    }
                else if (dragtype=='vresize') //table resize
                    {
                        var hgo = false;
                        $('body').css('cursor','row-resize');
                        if (obj)
                            {
                            hgo = true;
                            $('body').css('cursor','col-resize');
                            }
                        this.vresize = {h: p.height, sy: e.pageY, w: p.width, sx: e.pageX, hgo: hgo};

                    }

                else if (dragtype=='colMove') //column header drag
                    {
                        $(g.nDiv).hide();$(g.nBtn).hide();
                        this.hset = $(this.hDiv).offset();
                        this.hset.right = this.hset.left + $('table',this.hDiv).width();
                        this.hset.bottom = this.hset.top + $('table',this.hDiv).height();
                        this.dcol = obj;
                        this.dcoln = $('th',this.hDiv).index(obj);

                        this.colCopy = document.createElement("div");
                        this.colCopy.className = "colCopy";
                        this.colCopy.innerHTML = obj.innerHTML;
                        if ($.browser.msie)
                        {
                        this.colCopy.className = "colCopy ie";
                        }


                        $(this.colCopy).css({position:'absolute', 'float': 'left', display:'none', textAlign: obj.align});
                        $('body').append(this.colCopy);
                        $(this.cDrag).hide();

                    }

                $('body').noSelect();

            },
            dragMove: function (e) {

                if (this.colresize) //column resize
                    {
                        var n = this.colresize.n;
                        var diff = e.pageX-this.colresize.startX;
                        var nleft = this.colresize.ol + diff;
                        var nw = this.colresize.ow + diff;
                        if (nw > p.minwidth)
                            {
                                $('div:eq('+n+')',this.cDrag).css('left',nleft);
                                this.colresize.nw = nw;
                            }
                    }
                else if (this.vresize) //table resize
                    {
                        var v = this.vresize;
                        var y = e.pageY;
                        var diff = y-v.sy;

                        if (!p.defwidth) p.defwidth = p.width;

                        if (p.width != 'auto' && !p.nohresize && v.hgo)
                        {
                            var x = e.pageX;
                            var xdiff = x - v.sx;
                            var newW = v.w + xdiff;
                            if (newW > p.defwidth)
                                {
                                    this.gDiv.style.width = newW + 'px';
                                    p.width = newW;
                                }
                        }

                        var newH = v.h + diff;
                        if ((newH > p.minheight || p.height < p.minheight) && !v.hgo)
                            {
                                this.bDiv.style.height = newH + 'px';
                                p.height = newH;
                                this.fixHeight(newH);
                            }
                        v = null;
                    }
                else if (this.colCopy) {
                    $(this.dcol).addClass('thMove').removeClass('thOver');
                    if (e.pageX > this.hset.right || e.pageX < this.hset.left || e.pageY > this.hset.bottom || e.pageY < this.hset.top)
                    {
                        //this.dragEnd();
                        $('body').css('cursor','move');
                    }
                    else
                    $('body').css('cursor','pointer');
                    $(this.colCopy).css({top:e.pageY + 10,left:e.pageX + 20, display: 'block'});
                }

            },
            dragEnd: function () {

                if (this.colresize)
                    {
                        var n = this.colresize.n;
                        var nw = this.colresize.nw;

                                $('th:visible div:eq('+n+')',this.hDiv).css('width',nw);
                                $('tr',this.bDiv).each (
                                    function ()
                                        {
                                        $('td:visible div:eq('+n+')',this).css('width',nw);
                                        }
                                );
                                this.hDiv.scrollLeft = this.bDiv.scrollLeft;


                        $('div:eq('+n+')',this.cDrag).siblings().show();
                        $('.dragging',this.cDrag).removeClass('dragging');
                        this.rePosDrag();
                        this.fixHeight();
                        this.colresize = false;
                    }
                else if (this.vresize)
                    {
                        this.vresize = false;
                    }
                else if (this.colCopy)
                    {
                        $(this.colCopy).remove();
                        if (this.dcolt != null)
                        {


                            if (this.dcoln>this.dcolt)
                                $('th:eq('+this.dcolt+')',this.hDiv).before(this.dcol);
                            else
                                $('th:eq('+this.dcolt+')',this.hDiv).after(this.dcol);



                            this.switchCol(this.dcoln,this.dcolt);
                            $(this.cdropleft).remove();
                            $(this.cdropright).remove();
                            this.rePosDrag();


                        }

                        this.dcol = null;
                        this.hset = null;
                        this.dcoln = null;
                        this.dcolt = null;
                        this.colCopy = null;

                        $('.thMove',this.hDiv).removeClass('thMove');
                        $(this.cDrag).show();
                    }
                $('body').css('cursor','default');
                $('body').noSelect(false);
            },
            toggleCol: function(cid,visible) {

                var ncol = $("th[axis='col"+cid+"']",this.hDiv)[0];
                var n = $('thead th',g.hDiv).index(ncol);
                var cb = $('input[value='+cid+']',g.nDiv)[0];


                if (visible==null)
                    {
                        visible = ncol.hide;
                    }



                if ($('input:checked',g.nDiv).length<p.minColToggle&&!visible) return false;

                if (visible)
                    {
                        ncol.hide = false;
                        $(ncol).show();
                        cb.checked = true;
                    }
                else
                    {
                        ncol.hide = true;
                        $(ncol).hide();
                        cb.checked = false;
                    }

                        $('tbody tr',t).each
                            (
                                function ()
                                    {
                                        if (visible)
                                            $('td:eq('+n+')',this).show();
                                        else
                                            $('td:eq('+n+')',this).hide();
                                    }
                            );

                this.rePosDrag();

                if (p.onToggleCol) p.onToggleCol(cid,visible);

                return visible;
            },
            switchCol: function(cdrag,cdrop) { //switch columns

                $('tbody tr',t).each
                    (
                        function ()
                            {
                                if (cdrag>cdrop)
                                    $('td:eq('+cdrop+')',this).before($('td:eq('+cdrag+')',this));
                                else
                                    $('td:eq('+cdrop+')',this).after($('td:eq('+cdrag+')',this));
                            }
                    );

                    //switch order in nDiv
                    if (cdrag>cdrop)
                        $('tr:eq('+cdrop+')',this.nDiv).before($('tr:eq('+cdrag+')',this.nDiv));
                    else
                        $('tr:eq('+cdrop+')',this.nDiv).after($('tr:eq('+cdrag+')',this.nDiv));

                    if ($.browser.msie&&$.browser.version<7.0) $('tr:eq('+cdrop+') input',this.nDiv)[0].checked = true;

                    this.hDiv.scrollLeft = this.bDiv.scrollLeft;
            },
            scroll: function() {
                    this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                    this.rePosDrag();
            },
            addData: function (data) { //parse data
                this.data_downloaded = data;

                if (p.preProcess) {
                    data = p.preProcess(data);
                }

                if (!data) {
                    // There is no data after loading. Interrupt the loading here,
                    // set busy to to false and display an error message.
                    g.setBusy(false);
                    $('.pPageStat',this.pDiv).html(p.errormsg);
                    return false;
                }

                if (p.dataType=='xml') {
                    p.total = +$('rows total',data).text();
                } else {
                    p.total = data.total;
                }

                if (p.total==0)
                    {
                    $('tr, a, td, div',t).unbind();
                    $(t).empty();
                    p.pages = 1;
                    p.page = 1;
                    this.buildpager();
                    $('.pPageStat',this.pDiv).html(p.nomsg);
                    // Deactivate the busy mode.
                    g.setBusy(false);
                    return false;
                    }

                p.pages = Math.ceil(p.total/p.rp);

                if (p.dataType=='xml')
                    p.page = +$('rows page',data).text();
                else
                    p.page = data.page;

                this.buildpager();

                // Build new body...
                var tbody = document.createElement('tbody');
                // Select the body before. This is better because this selected jQuery object could be used more then one times in the next steps.
                var qtbody = $(tbody);

                // If Debugging is enabled record the start time of the rendering process.
                if (p.debug) {
                    var startTime = new Date();
                }

                /**
                 * This method is used to finalize the rendering of the data to the body if the grid list.
                 * @return (void)
                 */
                function finalizeRendering() {
                    var qt = $(t);
                    // Clean the current body compleate and add the new generated body.
                    $('tr', qt).unbind();
                    qt.empty();
                    qt.append(qtbody);

                    g.rePosDrag();

                    // This is paranoid but set the variables back to null. It is better for debugging.
                    tbody = null;
                    data = null;

                    // Call the onSuccess hook (if present).
                    if (p.onSuccess) {
                        p.onSuccess();
                    }

                    // Deactivate the busy mode.
                    g.setBusy(false);

                    if (p.debug && window.console && window.console.log) {
                        // If debugging is enabled log the duration of this operation.
                        var nowTime = new Date();
                        console.log('Duration of rendering data of type "' + p.dataType + '": ' + (nowTime - startTime) + 'ms');
                    }
                }

                // We will need the header cell at this point more times.
                // So we do better to store it not for further usages.
                var headers = $('thead tr:first th',g.hDiv);

                // What is going on here? Because of many rows we have to render, we do not
                // iterate with a regular foreach method. We make a pseudo asynchron process with
                // the setTimeout method. We do better to do this because in other way we will
                // force a lagging of the whole browser. In the worst case the user will get a
                // dialog box of an "endless looping javaScript".
                if (p.dataType=='json') {
                    // Prepare the looping parameters.
                    var ji = 0;
                    var row = null;

                    function doJsonRow() {
                        // Only if there are more rows we will render a next row.
                        if (data.rows.length > ji) {
                            row = data.rows[ji];
                            // Paranoid I know but it possible that there is an array selected with
                            // null entries.
                            if (row) {
                                var tr = document.createElement('tr');
                                var qtr = $(tr);
                                if (ji % 2 && p.striped) {
                                    tr.className = 'erow';
                                }
                                if (row.id) {
                                    tr.id = 'row' + row.id;
                                }
                                // Add each cell
                                for (idx = 0; idx < row.cell.length; idx++) {
                                    var td = document.createElement('td');
                                    var th = idx < headers.length ? headers[idx] : null;
                                    if (th) {
                                        td.align = th.align;
                                    }
                                    qtr.append(td);
                                    g.addCellProp(td, qtr, row.cell[idx], th);
                                }
                                qtbody.append(tr);
                                g.addRowProp(qtr);
                                // Prepare the next step.
                                tr = null;
                                ji++;
                                setTimeout(doJsonRow, 1);
                            } else {
                                finalizeRendering();
                            }
                        } else {
                            finalizeRendering();
                        }
                    }
                    // Start the pseudo asynchron iteration.
                    setTimeout(doJsonRow, 1);
                } else if (p.dataType=='xml') {
                    // Prepare the looping parameters.
                    var index = 1;
                    var xi = 0;
                    var rows = $("rows row", data);

                    function doXmlRow() {
                        // Only if there are more rows we will render a next row.
                        if (xi < rows.length) {
                            var row = rows[xi];
                            // Paranoid I know but it possible that there is an array selected with
                            // null entries.
                            if (row) {
                                var qrow = $(row);
                                index++;

                                var tr = document.createElement('tr');
                                var qtr = $(tr);
                                if (index % 2 && p.striped) {
                                    tr.className = 'erow';
                                }
                                var nid = qrow.attr('id');
                                if (nid) {
                                    tr.id = 'row' + nid;
                                }
                                nid = null;
                                var cells = $('cell', row);
                                // Add each cell
                                for (idx = 0; idx < cells.length; idx++) {
                                    var td = document.createElement('td');
                                    var th = idx < headers.length ? headers[idx] : null;
                                    if (th) {
                                        td.align = th.align;
                                    }
                                    qtr.append(td);
                                    g.addCellProp(td, qtr, $(cells[idx]).text(), th);
                                }
                                qtbody.append(tr);
                                // Prepare the next step.
                                tr = null;
                                xi++;
                                setTimeout(doXmlRow, 1);
                            } else {
                                finalizeRendering();
                            }
                        } else {
                            finalizeRendering();
                        }
                    }
                    // Start the pseudo asynchron iteration.
                    setTimeout(doXmlRow, 1);
                } else {
                    throw new Error('DataType "' + p.dataType + '" could not be handled.');
                }
            },
            changeSort: function(th) { //change sortorder

                if (this.loading) return true;

                $(g.nDiv).hide();$(g.nBtn).hide();

                if (p.sortname == $(th).attr('abbr'))
                    {
                        if (p.sortorder=='asc') p.sortorder = 'desc';
                        else p.sortorder = 'asc';
                    }

                $(th).addClass('sorted').siblings().removeClass('sorted');
                $('.sdesc',this.hDiv).removeClass('sdesc');
                $('.sasc',this.hDiv).removeClass('sasc');
                $('div',th).addClass('s'+p.sortorder);
                p.sortname= $(th).attr('abbr');

                if (p.onChangeSort)
                    p.onChangeSort(p.sortname,p.sortorder);
                else
                    this.populate();

            },
            buildpager: function(){ //rebuild pager based on new properties

            $('.pcontrol input',this.pDiv).val(p.page);
            $('.pcontrol span',this.pDiv).html(p.pages);

            var r1 = (p.page-1) * p.rp + 1;
            var r2 = r1 + p.rp - 1;

            if (p.total<r2) r2 = p.total;

            var stat = p.pagestat;

            stat = stat.replace(/{from}/,r1);
            stat = stat.replace(/{to}/,r2);
            stat = stat.replace(/{total}/,p.total);

            $('.pPageStat',this.pDiv).html(stat);

            },
            /**
             * This method is used to control the grid busy state.
             *
             * @param busy if set to true the grid list will get a semi transparent layer, a loading message will be displayed and a spinner.
             * If set to false this layer, spinner and message will be removed.
             * @return (boolean) true if the state is changed.
             */
            setBusy: function (busy) {
                var result = false;
                if (busy) {
                    if (!this.loading) {
                        this.loading = true;
                        $('.pPageStat',this.pDiv).html(p.procmsg);
                        $('.pReload',this.pDiv).addClass('loading');
                        $(g.block).css({top:g.bDiv.offsetTop});
                        if (p.hideOnSubmit) {
                            $(this.gDiv).prepend(g.block); //$(t).hide();
                        }
                        if ($.browser.opera) {
                            $(t).css('visibility','hidden');
                        }
                        result = true;
                    }
                } else {
                    if (this.loading) {
                        var qstatus = $('.pPageStat',this.pDiv);
                        if (qstatus.html() == p.procmsg) {
                            $('.pPageStat',this.pDiv).text('');
                        }
                        $('.pReload',this.pDiv).removeClass('loading');
                        if (p.hideOnSubmit) {
                            $(g.block).remove(); //$(t).show();
                        }
                        g.hDiv.scrollLeft = g.bDiv.scrollLeft;
                        if ($.browser.opera) {
                            $(t).css('visibility','visible');
                        }

                        this.loading = false;
                        result = true;
                    }
                }
                return result;
            },
            populate: function () { //get latest data

                if (this.loading) return true;

                if (p.onSubmit)
                    {
                        var gh = p.onSubmit();
                        if (!gh) return false;
                    }

                if (!p.url) return false;

                // Make this grid list busy for the user.
                this.setBusy(true);

                if (!p.newp) p.newp = 1;

                if (p.page>p.pages) p.page = p.pages;
                //var param = {page:p.newp, rp: p.rp, sortname: p.sortname, sortorder: p.sortorder, query: p.query, qtype: p.qtype};
                var data = [];
                var params = [
                     { name : 'page', value : p.newp }
                    ,{ name : 'rp', value : p.rp }
                    ,{ name : 'sortname', value : p.sortname}
                    ,{ name : 'sortorder', value : p.sortorder }
                    ,{ name : 'query', value : p.query}
                    ,{ name : 'qtype', value : p.qtype}
                ];

                // Only add parameters to request data which are not null.
                for (i in params) {
                    var param = params[i];
                    if (param && param.name && param.value) {
                        data.push(param);
                    }
                }
                // If there are some additional parameters and each are not null add it to the request data.
                if (p.params) {
                    for (pi in p.params) {
                        var current = p.params[pi];
                        if (current && current.name && current.value) {
                            data.push(current);
                        }
                    }
                }
                // Call prepareRequest hook.
                if (p.prepareRequest) {
                    p.prepareRequest(data);
                }

                $.ajax({
                   type: p.method,
                   url: p.url,
                   data: data,
                   dataType: p.dataType,
                   success: function(data){g.addData(data);},
		   error: function(XMLHttpRequest, textStatus, errorThrown) { 
		     try { 
                       g.setBusy(false);
		       if (p.onError) 
		         p.onError(XMLHttpRequest, textStatus, errorThrown); 
	             } catch (e) {} 
                     return false;
		   }
                 });
            },
            doSearch: function () {
                p.query = $('input[name=q]',g.sDiv).val();
                p.qtype = $('select[name=qtype]',g.sDiv).val();
                p.newp = 1;

                this.populate();
            },
            changePage: function (ctype){ //change page

                if (this.loading) return true;

                switch(ctype)
                {
                    case 'first': p.newp = 1; break;
                    case 'prev': if (p.page>1) p.newp = parseInt(p.page) - 1; break;
                    case 'next': if (p.page<p.pages) p.newp = parseInt(p.page) + 1; break;
                    case 'last': p.newp = p.pages; break;
                    case 'input':
                            var nv = parseInt($('.pcontrol input',this.pDiv).val());
                            if (isNaN(nv)) nv = 1;
                            if (nv<1) nv = 1;
                            else if (nv > p.pages) nv = p.pages;
                            $('.pcontrol input',this.pDiv).val(nv);
                            p.newp =nv;
                            break;
                }

                if (p.newp==p.page) return false;

                if (p.onChangePage)
                    p.onChangePage(p.newp);
                else
                    this.populate();

            },
            addCellProp: function (cell, prnt, innerHtml, pth) {
                var tdDiv = document.createElement('div');
                var qtdDiv = $(tdDiv);
                var qcell = $(cell);
                if (pth != null) {
                    /*
                    if (p.sortname == $(pth).attr('abbr') && p.sortname) {
                        cell.className = 'sorted';
                    }
                    */
                    qtdDiv.css({textAlign:pth.align,width: $('div:first', pth)[0].style.width});

                    if (pth.hide) {
                        qcell.css('display', 'none');
                    }
                }

                if (p.nowrap == false) {
                    qtdDiv.css('white-space', 'normal');
                }

                if (!innerHtml || innerHtml == '') {
                    innerHtml = '&nbsp;';
                }

                tdDiv.innerHTML = innerHtml;

                var pid = false;
                if (prnt.id) {
                    pid = prnt.id.substr(3);
                }

                if (pth != null && pth.process) {
                    pth.process(tdDiv, pid);
                }

                qcell.empty().append(tdDiv).removeAttr('width');
            },
            getCellDim: function (obj) // get cell prop for editable event
            {
                var ht = parseInt($(obj).height());
                var pht = parseInt($(obj).parent().height());
                var wt = parseInt(obj.style.width);
                var pwt = parseInt($(obj).parent().width());
                var top = obj.offsetParent.offsetTop;
                var left = obj.offsetParent.offsetLeft;
                var pdl = parseInt($(obj).css('paddingLeft'));
                var pdt = parseInt($(obj).css('paddingTop'));
                return {ht:ht,wt:wt,top:top,left:left,pdl:pdl, pdt:pdt, pht:pht, pwt: pwt};
            },
            addRowProp: function(qrow) {
                qrow.click(function (e) {
                    var obj = (e.target || e.srcElement);
                    if (obj.href || obj.type) {
                        return true;
                    }
                    $(this).toggleClass('trSelected');
                    if (p.singleSelect) {
                        qrow.siblings().removeClass('trSelected');
                    }
                }).mousedown(function (e) {
                    if (e.shiftKey) {
                        $(this).toggleClass('trSelected');
                        g.multisel = true;
                        this.focus();
                        $(g.gDiv).noSelect();
                    }
                }).mouseup(function () {
                    if (g.multisel) {
                        g.multisel = false;
                        $(g.gDiv).noSelect(false);
                    }
                }).hover(function () {
                    if (g.multisel) {
                        $(this).toggleClass('trSelected');
                    }
                }, function () {
                });

                if ($.browser.msie && $.browser.version < 7.0) {
                    qrow.hover(function () {
                        $(this).addClass('trOver');
                    }, function () {
                        $(this).removeClass('trOver');
                    });
                }


            },
            pager: 0
            };

        //create model if any
        if (p.colModel)
        {
            thead = document.createElement('thead');
            tr = document.createElement('tr');

            for (i=0;i<p.colModel.length;i++)
                {
                    var cm = p.colModel[i];
                    var th = document.createElement('th');

                    th.innerHTML = cm.display;

                    if (cm.name&&cm.sortable)
                        $(th).attr('abbr',cm.name);

                    //th.idx = i;
                    $(th).attr('axis','col'+i);

                    if (cm.align)
                        th.align = cm.align;

                    if (cm.width)
                        $(th).attr('width',cm.width);

                    if (cm.hide)
                        {
                        th.hide = true;
                        }

                    if (cm.process)
                        {
                            th.process = cm.process;
                        }

                    $(tr).append(th);
                }
            $(thead).append(tr);
            $(t).prepend(thead);
        } // end if p.colmodel

        //init divs
        g.gDiv = document.createElement('div'); //create global container
        g.mDiv = document.createElement('div'); //create title container
        g.hDiv = document.createElement('div'); //create header container
        g.bDiv = document.createElement('div'); //create body container
        g.vDiv = document.createElement('div'); //create grip
        g.rDiv = document.createElement('div'); //create horizontal resizer
        g.cDrag = document.createElement('div'); //create column drag
        g.block = document.createElement('div'); //creat blocker
        g.nDiv = document.createElement('div'); //create column show/hide popup
        g.nBtn = document.createElement('div'); //create column show/hide button
        g.iDiv = document.createElement('div'); //create editable layer
        g.tDiv = document.createElement('div'); //create toolbar
        g.sDiv = document.createElement('div');

        if (p.usepager) g.pDiv = document.createElement('div'); //create pager container
        g.hTable = document.createElement('table');

        //set gDiv
        g.gDiv.className = 'flexigrid';
        if (p.width!='auto') g.gDiv.style.width = p.width + 'px';

        //add conditional classes
        if ($.browser.msie)
            $(g.gDiv).addClass('ie');

        if (p.novstripe)
            $(g.gDiv).addClass('novstripe');

        $(t).before(g.gDiv);
        $(g.gDiv)
        .append(t)
        ;

        //set toolbar
        if (p.buttons)
        {
            g.tDiv.className = 'tDiv';
            var tDiv2 = document.createElement('div');
            tDiv2.className = 'tDiv2';

            for (i=0;i<p.buttons.length;i++)
                {
                    var btn = p.buttons[i];
                    if (!btn.separator)
                    {
                        var btnDiv = document.createElement('div');
                        btnDiv.className = 'fbutton';
                        btnDiv.innerHTML = "<div><span>"+btn.name+"</span></div>";
                        if (btn.bclass)
                            $('span',btnDiv)
                            .addClass(btn.bclass)
                            .css({paddingLeft:20})
                            ;
                        btnDiv.onpress = btn.onpress;
                        btnDiv.name = btn.name;
                        if (btn.onpress)
                        {
                            $(btnDiv).click
                            (
                                function ()
                                {
                                this.onpress(this.name,g.gDiv);
                                }
                            );
                        }
                        $(tDiv2).append(btnDiv);
                        if ($.browser.msie&&$.browser.version<7.0)
                        {
                            $(btnDiv).hover(function(){$(this).addClass('fbOver');},function(){$(this).removeClass('fbOver');});
                        }

                    } else {
                        $(tDiv2).append("<div class='btnseparator'></div>");
                    }
                }
                $(g.tDiv).append(tDiv2);
                $(g.tDiv).append("<div style='clear:both'></div>");
                $(g.gDiv).prepend(g.tDiv);
        }

        //set hDiv
        g.hDiv.className = 'hDiv';

        $(t).before(g.hDiv);

        //set hTable
            g.hTable.cellPadding = 0;
            g.hTable.cellSpacing = 0;
            $(g.hDiv).append('<div class="hDivBox"></div>');
            $('div',g.hDiv).append(g.hTable);
            var thead = $("thead:first",t).get(0);
            if (thead) $(g.hTable).append(thead);
            thead = null;

        if (!p.colmodel) var ci = 0;

        //setup thead
            $('thead tr:first th',g.hDiv).each
            (
                 function ()
                    {
                        var thdiv = document.createElement('div');



                        if ($(this).attr('abbr'))
                            {
                            $(this).click(
                                function (e)
                                    {

                                        if (!$(this).hasClass('thOver')) return false;
                                        var obj = (e.target || e.srcElement);
                                        if (obj.href || obj.type) return true;
                                        g.changeSort(this);
                                    }
                            )
                            ;

                            if ($(this).attr('abbr')==p.sortname)
                                {
                                this.className = 'sorted';
                                thdiv.className = 's'+p.sortorder;
                                }
                            }

                            if (this.hide) $(this).hide();

                            if (!p.colmodel)
                            {
                                $(this).attr('axis','col' + ci++);
                            }


                         $(thdiv).css({textAlign:this.align, width: this.width + 'px'});
                         thdiv.innerHTML = this.innerHTML;

                        $(this).empty().append(thdiv).removeAttr('width')
                        .mousedown(function (e) {
                            if (p.reorderable){
                                g.dragStart('colMove',e,this);
                            }
                        })
                        .hover(
                            function(){
                                if (!g.colresize&&!$(this).hasClass('thMove')&&!g.colCopy) $(this).addClass('thOver');

                                if ($(this).attr('abbr')!=p.sortname&&!g.colCopy&&!g.colresize&&$(this).attr('abbr')) 
                                    $('div',this).addClass('s'+p.sortorder);
                                else if ($(this).attr('abbr')==p.sortname&&!g.colCopy&&!g.colresize&&$(this).attr('abbr'))
                                {
                                        var no = '';
                                        if (p.sortorder=='asc') no = 'desc';
                                        else no = 'asc';
                                        $('div',this).removeClass('s'+p.sortorder).addClass('s'+no);
                                }

                                if (g.colCopy)
                                {
                                    var n = $('th',g.hDiv).index(this);

                                    if (n==g.dcoln) return false;

                                    if (n<g.dcoln) $(this).append(g.cdropleft);
                                    else $(this).append(g.cdropright);

                                    g.dcolt = n;

                                } else if (!g.colresize) {

                                    var nv = $('th:visible',g.hDiv).index(this);
                                    var onl = parseInt($('div:eq('+nv+')',g.cDrag).css('left'));
                                    var nw = parseInt($(g.nBtn).width()) + parseInt($(g.nBtn).css('borderLeftWidth'));
                                    if(isNaN(nw)) nw = 0;
                                    nl = onl - nw + Math.floor(p.cgwidth/2);

                                    $(g.nDiv).hide();
                                    $(g.nBtn).hide();

                                    if(p.showToggleBtn){
                                      $(g.nBtn).css({'left':nl,top:g.hDiv.offsetTop}).show();
                                    }

                                    var ndw = parseInt($(g.nDiv).width());

                                    $(g.nDiv).css({top:g.bDiv.offsetTop});

                                    if(p.showToggleBtn){
                                      if ((nl+ndw)>$(g.gDiv).width())
                                          $(g.nDiv).css('left',onl-ndw+1);
                                      else
                                          $(g.nDiv).css('left',nl);
                                    }

                                    if ($(this).hasClass('sorted'))
                                        $(g.nBtn).addClass('srtd');
                                    else
                                        $(g.nBtn).removeClass('srtd');

                                }

                            },
                            function(){
                                $(this).removeClass('thOver');
                                if ($(this).attr('abbr')!=p.sortname) $('div',this).removeClass('s'+p.sortorder);
                                else if ($(this).attr('abbr')==p.sortname)
                                    {
                                        var no = '';
                                        if (p.sortorder=='asc') no = 'desc';
                                        else no = 'asc';

                                        $('div',this).addClass('s'+p.sortorder).removeClass('s'+no);
                                    }
                                if (g.colCopy)
                                    {
                                    $(g.cdropleft).remove();
                                    $(g.cdropright).remove();
                                    g.dcolt = null;
                                    }
                            })
                        ; //wrap content
                    }
            );

        //set bDiv
        g.bDiv.className = 'bDiv';
        $(t).before(g.bDiv);
        $(g.bDiv)
        .css({ height: (p.height=='auto') ? 'auto' : p.height+"px"})
        .scroll(function (e) {g.scroll()})
        .append(t)
        ;

        if (p.height == 'auto')
            {
            $('table',g.bDiv).addClass('autoht');
            }


                $('tbody', g.bDiv).hide();

        //set cDrag

        var cdcol = $('thead tr:first th:first',g.hDiv).get(0);

        if (cdcol != null)
        {
            g.cDrag.className = 'cDrag';
            g.cdpad = 0;
    
            g.cdpad += (isNaN(parseInt($('div',cdcol).css('borderLeftWidth'))) ? 0 : parseInt($('div',cdcol).css('borderLeftWidth')));
            g.cdpad += (isNaN(parseInt($('div',cdcol).css('borderRightWidth'))) ? 0 : parseInt($('div',cdcol).css('borderRightWidth')));
            g.cdpad += (isNaN(parseInt($('div',cdcol).css('paddingLeft'))) ? 0 : parseInt($('div',cdcol).css('paddingLeft')));
            g.cdpad += (isNaN(parseInt($('div',cdcol).css('paddingRight'))) ? 0 : parseInt($('div',cdcol).css('paddingRight')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('borderLeftWidth'))) ? 0 : parseInt($(cdcol).css('borderLeftWidth')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('borderRightWidth'))) ? 0 : parseInt($(cdcol).css('borderRightWidth')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('paddingLeft'))) ? 0 : parseInt($(cdcol).css('paddingLeft')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('paddingRight'))) ? 0 : parseInt($(cdcol).css('paddingRight')));
    
            $(g.bDiv).before(g.cDrag);
    
            var cdheight = $(g.bDiv).height();
            var hdheight = $(g.hDiv).height();
    
            $(g.cDrag).css({top: -hdheight + 'px'});
    
            if (p.colresizable){
                $('thead tr:first th',g.hDiv).each(function () {
                        var cgDiv = document.createElement('div');
                        $(g.cDrag).append(cgDiv);
                        if (!p.cgwidth) p.cgwidth = $(cgDiv).width();
                        $(cgDiv).css({height: cdheight + hdheight});
                        $(cgDiv).mousedown(function(e){ g.dragStart('colresize',e,this); });
                        if ($.browser.msie&&$.browser.version<7.0)
                        {
                            g.fixHeight($(g.gDiv).height());
                            $(cgDiv).hover(function () {
                                    g.fixHeight();
                                $(this).addClass('dragging')
                            },
                            function () { if (!g.colresize) $(this).removeClass('dragging') }
                            );
                        }
                    });
    
                g.rePosDrag();
    
            }
        }


        //add strip
        if (p.striped)
            $('tbody tr:odd',g.bDiv).addClass('erow');


        if (p.resizable && p.height !='auto')
        {
        g.vDiv.className = 'vGrip';
        $(g.vDiv)
        .mousedown(function (e) { g.dragStart('vresize',e)})
        .html('<span></span>');
        $(g.bDiv).after(g.vDiv);
        }

        if (p.resizable && p.width !='auto' && !p.nohresize)
        {
        g.rDiv.className = 'hGrip';
        $(g.rDiv)
        .mousedown(function (e) {g.dragStart('vresize',e,true);})
        .html('<span></span>')
        .css('height',$(g.gDiv).height())
        ;
        if ($.browser.msie&&$.browser.version<7.0)
        {
            $(g.rDiv).hover(function(){$(this).addClass('hgOver');},function(){$(this).removeClass('hgOver');});
        }
        $(g.gDiv).append(g.rDiv);
        }

        // add pager
        if (p.usepager)
        {
        g.pDiv.className = 'pDiv';
        g.pDiv.innerHTML = '<div class="pDiv2"></div>';
        $(g.bDiv).after(g.pDiv);
        var html = ' <div class="pGroup"> <div class="pFirst pButton"><span></span></div><div class="pPrev pButton"><span></span></div> </div> <div class="btnseparator"></div> <div class="pGroup"><span class="pcontrol">'+ p.pagetext + ' <input type="text" size="4" value="1" /> ' + p.outof + ' <span> 1 </span></span></div> <div class="btnseparator"></div> <div class="pGroup"> <div class="pNext pButton"><span></span></div><div class="pLast pButton"><span></span></div> </div> <div class="btnseparator"></div> <div class="pGroup"> <div class="pReload pButton"><span></span></div> </div> <div class="btnseparator"></div> <div class="pGroup"><span class="pPageStat"></span></div>';
        $('div',g.pDiv).html(html);

        $('.pReload',g.pDiv).click(function(){g.populate()});
        $('.pFirst',g.pDiv).click(function(){g.changePage('first')});
        $('.pPrev',g.pDiv).click(function(){g.changePage('prev')});
        $('.pNext',g.pDiv).click(function(){g.changePage('next')});
        $('.pLast',g.pDiv).click(function(){g.changePage('last')});
        $('.pcontrol input',g.pDiv).keydown(function(e){if(e.keyCode==13) g.changePage('input')});
        if ($.browser.msie&&$.browser.version<7) $('.pButton',g.pDiv).hover(function(){$(this).addClass('pBtnOver');},function(){$(this).removeClass('pBtnOver');});

            if (p.useRp)
            {
            var opt = "";
            for (var nx=0;nx<p.rpOptions.length;nx++)
            {
                if (p.rp == p.rpOptions[nx]) sel = 'selected="selected"'; else sel = '';
                 opt += "<option value='" + p.rpOptions[nx] + "' " + sel + " >" + p.rpOptions[nx] + "&nbsp;&nbsp;</option>";
            };
            $('.pDiv2',g.pDiv).prepend("<div class='pGroup'><select name='rp'>"+opt+"</select></div> <div class='btnseparator'></div>");
            $('select',g.pDiv).change(
                    function ()
                    {
                        if (p.onRpChange)
                            p.onRpChange(+this.value);
                        else
                            {
                            p.newp = 1;
                            p.rp = +this.value;
                            g.populate();
                            }
                    }
                );
            }

        //add search button
        if (p.searchitems)
            {
                $('.pDiv2',g.pDiv).prepend("<div class='pGroup'> <div class='pSearch pButton'><span></span></div> </div>  <div class='btnseparator'></div>");
                $('.pSearch',g.pDiv).click(function(){$(g.sDiv).slideToggle('fast',function(){$('.sDiv:visible input:first',g.gDiv).trigger('focus');});});
                //add search box
                g.sDiv.className = 'sDiv';

                sitems = p.searchitems;

                var sopt = "";
                for (var s = 0; s < sitems.length; s++)
                {
                    if (p.qtype=='' && sitems[s].isdefault==true)
                    {
                    p.qtype = sitems[s].name;
                    sel = 'selected="selected"';
                    } else sel = '';
                    sopt += "<option value='" + sitems[s].name + "' " + sel + " >" + sitems[s].display + "&nbsp;&nbsp;</option>";
                }

                if (p.qtype=='') p.qtype = sitems[0].name;

                $(g.sDiv).append("<div class='sDiv2'>Quick Search <input type='text' size='30' name='q' class='qsbox' /> <select name='qtype'>"+sopt+"</select> <input type='button' value='Clear' /></div>");

                $('input[name=q],select[name=qtype]',g.sDiv).keydown(function(e){if(e.keyCode==13) g.doSearch()});
                $('input[value=Clear]',g.sDiv).click(function(){$('input[name=q]',g.sDiv).val(''); p.query = ''; g.doSearch(); });
                $(g.bDiv).after(g.sDiv);

            }

        }
        $(g.pDiv,g.sDiv).append("<div style='clear:both'></div>");

        // add title
        if (p.title)
        {
            g.mDiv.className = 'mDiv';
            g.mDiv.innerHTML = '<div class="ftitle">'+p.title+'</div>';
            $(g.gDiv).prepend(g.mDiv);
            if (p.showTableToggleBtn)
                {
                    $(g.mDiv).append('<div class="ptogtitle" title="Minimize/Maximize Table"><span></span></div>');
                    $('div.ptogtitle',g.mDiv).click
                    (
                         function ()
                            {
                                $(g.gDiv).toggleClass('hideBody');
                                $(this).toggleClass('vsble');
                            }
                    );
                }
            //g.rePosDrag();
        }

        //setup cdrops
        g.cdropleft = document.createElement('span');
        g.cdropleft.className = 'cdropleft';
        g.cdropright = document.createElement('span');
        g.cdropright.className = 'cdropright';

        //add block
        g.block.className = 'gBlock';
        var gh = $(g.bDiv).height();
        var gtop = g.bDiv.offsetTop;
        $(g.block).css(
        {
            width: g.bDiv.style.width,
            height: gh,
            background: 'white',
            position: 'relative',
            marginBottom: (gh * -1),
            zIndex: 1,
            top: gtop,
            left: '0px'
        }
        );
        $(g.block).fadeTo(0,p.blockOpacity);

        // add column control
        if ($('th',g.hDiv).length)
        {

            g.nDiv.className = 'nDiv';
            g.nDiv.innerHTML = "<table cellpadding='0' cellspacing='0'><tbody></tbody></table>";
            $(g.nDiv).css(
            {
                marginBottom: (gh * -1),
                display: 'none',
                top: gtop
            }
            ).noSelect()
            ;

            var cn = 0;


            $('th div',g.hDiv).each
            (
                 function ()
                    {
                        var kcol = $("th[axis='col" + cn + "']",g.hDiv)[0];
                        var chk = 'checked="checked"';
                        if (kcol.style.display=='none') chk = '';

                        $('tbody',g.nDiv).append('<tr><td class="ndcol1"><input type="checkbox" '+ chk +' class="togCol" value="'+ cn +'" /></td><td class="ndcol2">'+this.innerHTML+'</td></tr>');
                        cn++;
                    }
            );

            if ($.browser.msie&&$.browser.version<7.0)
                $('tr',g.nDiv).hover
                (
                     function () {$(this).addClass('ndcolover');},
                    function () {$(this).removeClass('ndcolover');}
                );

            $('td.ndcol2',g.nDiv).click
            (
                 function ()
                    {
                        if ($('input:checked',g.nDiv).length<=p.minColToggle&&$(this).prev().find('input')[0].checked) return false;
                        return g.toggleCol($(this).prev().find('input').val());
                    }
            );

            $('input.togCol',g.nDiv).click
            (
                 function ()
                    {

                        if ($('input:checked',g.nDiv).length<p.minColToggle&&this.checked==false) return false;
                        $(this).parent().next().trigger('click');
                        //return false;
                    }
            );


            $(g.gDiv).prepend(g.nDiv);

            $(g.nBtn).addClass('nBtn')
            .html('<div></div>')
            .attr('title','Hide/Show Columns')
            .click
            (
                 function ()
                {
                 $(g.nDiv).toggle(); return true;
                }
            );

            if (p.showToggleBtn) $(g.gDiv).prepend(g.nBtn);

        }

        // add date edit layer
        $(g.iDiv)
        .addClass('iDiv')
        .css({display:'none'})
        ;
        $(g.bDiv).append(g.iDiv);

        // add flexigrid events
        $(g.bDiv)
        .hover(function(){$(g.nDiv).hide();$(g.nBtn).hide();},function(){if (g.multisel) g.multisel = false;})
        ;
        $(g.gDiv)
        .hover(function(){},function(){$(g.nDiv).hide();$(g.nBtn).hide();})
        ;

        //add document events
        $(document)
        .mousemove(function(e){g.dragMove(e)})
        .mouseup(function(e){g.dragEnd()})
        .hover(function(){},function (){g.dragEnd()})
        ;

        //browser adjustments
        if ($.browser.msie&&$.browser.version<7.0)
        {
            $('.hDiv,.bDiv,.mDiv,.pDiv,.vGrip,.tDiv, .sDiv',g.gDiv)
            .css({width: '100%'});
            $(g.gDiv).addClass('ie6');
            if (p.width!='auto') $(g.gDiv).addClass('ie6fullwidthbug');
        }

        g.rePosDrag();
        g.fixHeight();

        //make grid functions accessible
        t.p = p;
        t.grid = g;

        // Load data if possible and enabled.
        if (p.url && p.autoload) {
            g.populate();
        } else {
            // If Debugging is enabled record the start time of the rendering process.
            if (p.debug) {
                var startTime = new Date();
            }
            // Make this grid list busy for the user.
            g.setBusy(true);

            /**
             * This method is used to finalize the rendering of the data to the body if the grid list.
             * @return (void)
             */
            function finalizeRendering() {
                g.setBusy(false);
                $('tbody', g.bDiv).show();

                if (p.debug && window.console && window.console.log) {
                    var nowTime = new Date();
                    console.log('Duration of rendering data of type "inlineHtml": ' + (nowTime - startTime) + 'ms');
                }
            }

            // Add tr and td properties

            // What is going on here? Because of many rows we have to render, we do not
            // iterate with a regular foreach method. We make a pseudo asynchron process with
            // the setTimeout method. We do better to do this because in other way we will
            // force a lagging of the whole browser. In the worst case the user will get a
            // dialog box of an "endless looping javaScript".

            // Set initial properties for rendering the data.
            var qth = $('thead tr:first th',g.hDiv);
            var rows = $('tbody tr', g.bDiv);
            var rowIndex = 0;
            function doRow() {
                // Only if there are more rows we will render a next row.
                if (rowIndex < rows.length) {
                    var tr = rows[rowIndex];
                    // Paranoid I know but it possible that there is an array selected with
                    // null entries.
                    if (tr) {
                        var qtr = $(tr);
                        var i = 0;
                        $('td', tr).each(function() {
                            var header = false;
                            if (qth.length > i) {
                                header = qth[i] || false;
                            }
                            g.addCellProp(this, tr, this.innerHTML, header);
                            i++;
                        });
                        g.addRowProp(qtr);
                        // Prepare the next step.
                        rowIndex++;
                        setTimeout(doRow, 1);
                    } else {
                        finalizeRendering();
                    }
                } else {
                    finalizeRendering();
                }
            }
            // Start the pseudo asynchron iteration.
            setTimeout(doRow, 1);
        }

        return t;

    };

    var docloaded = false;

    $(document).ready(function () {docloaded = true} );

    $.fn.flexigrid = function(p) {

        return this.each( function() {
                if (!docloaded)
                {
                    $(this).hide();
                    var t = this;
                    $(document).ready
                    (
                        function ()
                        {
                        $.addFlex(t,p);
                        }
                    );
                } else {
                    $.addFlex(this,p);
                }
            });

    }; //end flexigrid

    $.fn.flexReload = function(p) { // function to reload grid

        return this.each( function() {
                if (this.grid&&this.p.url) this.grid.populate();
            });

    }; //end flexReload

    $.fn.flexOptions = function(p) { //function to update general options

        return this.each( function() {
                if (this.grid) $.extend(this.p,p);
            });

    }; //end flexOptions

        $.fn.flexGetOptions = function() { // function to get data to grid
              var options = null;
              this.each( function() {
                  if (this.grid) { options = this.p; }
              });
              return options;
        };

    $.fn.flexToggleCol = function(cid,visible) { // function to reload grid

        return this.each( function() {
                if (this.grid) this.grid.toggleCol(cid,visible);
            });

    }; //end flexToggleCol

        $.fn.flexGetData = function() { // function to get data to grid
              var data = null;
              this.each( function() {
                  if (this.grid) { data = this.grid.data_downloaded; }
              });
              return data;
        };

    $.fn.flexAddData = function(data) { // function to add data to grid

        return this.each( function() {
                if (this.grid) this.grid.addData(data);
            });

    };

    $.fn.noSelect = function(p) { //no select plugin by me :-)

        if (p == null)
            prevent = true;
        else
            prevent = p;

        if (prevent) {

        return this.each(function ()
            {
                if ($.browser.msie||$.browser.safari) $(this).bind('selectstart',function(){return false;});
                else if ($.browser.mozilla)
                    {
                        $(this).css('MozUserSelect','none');
                        $('body').trigger('focus');
                    }
                else if ($.browser.opera) $(this).bind('mousedown',function(){return false;});
                else $(this).attr('unselectable','on');
            });

        } else {


        return this.each(function ()
            {
                if ($.browser.msie||$.browser.safari) $(this).unbind('selectstart');
                else if ($.browser.mozilla) $(this).css('MozUserSelect','inherit');
                else if ($.browser.opera) $(this).unbind('mousedown');
                else $(this).removeAttr('unselectable','on');
            });

        }

    }; //end noSelect

})(jQuery);
