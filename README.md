# Flexigrid

by Paulo P. Marinas

Also includes performance enhancements from
http://docs.optivo.net/opensource/flexigrid/flexigrid_2008-07-14_performance_1.p
atch/ mentioned in this thread http://markmail.org/message/c5bu2zybzaehygba.

Also added some extra options to be able to disable the colresize, etc.
Just look at the available options now.

(from the [google code page](http://code.google.com/p/flexigrid/))
Lightweight but rich data grid with resizable columns and a scrolling data to match the headers, plus an ability to connect to an xml based data source using Ajax to load the content.

Similar in concept with the Ext Grid only its pure jQuery love, which makes it light weight and follows the jQuery mantra of running with the least amount of configuration.

#### Features

* Resizable columns
* Resizable height and width
* Sortable column headers
* Cool theme
* Can convert an ordinary table
* Ability to connect to an ajax data source (XML and JSONnew)
* Paging
* Show/hide columns
* Toolbar (new)
* Search (new)
* Accessible API
* Resizable Width
* JSON Support
* Toolbar
* Table Toggle Button
* Show/Hide Columns control have been move to the column headers (try it by mouseovering a header and clicking a black triangle on the right)
* Fixed paging problem on multiple instances
* Mootools and Prototype noConflict() compatibility problems fixed
* New onError event on ajax interaction, (it will pass what the server said in a variable called data), allowing you to handle server problems
* New $().flexAddData method, allows you to directly add new data to the grid using your own data source.
* New preProcess API, allows you to modify or process data sent by server before passing it to Flexigrid, allowing you to use your own JSON format for example.
* Single Rows Select just use { singleSelect: true } in the options
* Quick Search
* Many more
* I'm planning to add an Editable and Resortable rows feature, as well as other cool GUI features.

One of my main goal for the plugin is ultimately to keep it lightweight, maybe under 20k when compressed. Because otherwise you should probably stick with Ext Grid or YUI data table.

Lightweight but rich data grid with resizable columns and a scrolling data to match the headers, plus an ability to connect to an xml based data source using Ajax to load the content. 
 
Similar in concept with the Ext Grid only its pure jQuery love, which makes it light weight and follows the jQuery mantra of running with the least amount of configuration.

Thanks to this guys for creating examples so other people can use Flexigrid, and made my life a little easier:

A more complete PHP example by Kevin Kietel: http://sanderkorvemaker.nl/test/flexigrid/

CodeIgniter example by Armorfist: http://flexigrid.eyeviewdesign.com/

ASP example by Synergiq: http://jamesowers.co.uk/asp-tutorials/57/flexigrid-with-asp/

Ruby on Rails example by Nick Fessel: http://www.nickfessel.com/

ASP.NET example by Todd Smith : http://www.codeproject.com/KB/aspnet/MVCFlexigrid.aspx

A lot of confusion was made on how to use a custom form with Flexigrid, so I made a semi official example.

Custom form example: http://flexigrid.info/sample1.html

Support Flexigrid!
