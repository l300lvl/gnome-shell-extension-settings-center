const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Extension.imports.lib;
const MenuItems = Extension.imports.menu_items;

const schema = "org.gnome.shell.extensions.SettingsCenter";

function init(extensionMeta)
{
    return new SettingsCenter(extensionMeta, schema);
}

function SettingsCenter(extensionMeta, schema)
{
    this.init(extensionMeta, schema);
}

SettingsCenter.prototype =
{
    schema: null,
    settings: null,
    settingSignals: null,

    settingsCenterMenu: null,
    items: null,
    replaceMenu: null,

    init: function(extensionMeta, schema)
    {
	this.schema = schema;
    },

    onPreferencesActivate: function()
    {
	let app = Shell.AppSystem.get_default().lookup_app('gnome-control-center.desktop');
	app.activate();
    },

    launch: function(object, pspec, settingItem)
    {
        if (settingItem['cmd'].match(/.desktop$/))
        {
            let app = Shell.AppSystem.get_default().lookup_app(settingItem['cmd']);

            if (app != null)
                app.activate();
            else if (settingItem['cmd-alt'] != null)
                Util.spawn([settingItem['cmd-alt']]);
        }
        else
	{
	    let cmdArray = settingItem['cmd'].split(" ");
            Util.spawn(cmdArray);
	}
    },

    onParamChanged: function()
    {
        this.disable();
        this.enable();
    },

    enable: function()
    {
	let settings = new Lib.Settings(this.schema);
        this.settings = settings.getSettings();

	this.settingSignals = new Array();

	let menuItems = new MenuItems.MenuItems(this.settings);
        this.items = menuItems.getEnableItems();

        let userMenu = Main.panel._statusArea.userMenu;

	//Find System Settings menu position
        let index = null;
        let menuItems = userMenu.menu._getMenuItems();
        for (let i = 0; i < menuItems.length; i++)
        {    
	    if (
		typeof (menuItems[i]._children) == "object"
		    && typeof (menuItems[i]._children[0]) == "object"
		    && typeof (menuItems[i]._children[0].actor) == "object"
		    && typeof (menuItems[i]._children[0].actor.get_text) == "function"
		    && menuItems[i]._children[0].actor.get_text() == _("System Settings"))
	    {
                index = i;
                break;
	    }
        }

	this.replaceMenu = this.settings.get_boolean("replace-ss-menu");

	//If no find, set the position arbitrary and force "replace menu" to Off
	if (index == null)
	{
	    index = 4;
	    this.replaceMenu = false;
	}
        
	if (this.replaceMenu || this.items.length > 0)
	{
            this.settingsCenterMenu = new PopupMenu.PopupSubMenuMenuItem(_(this.settings.get_string("label-menu")));

	    //Add new menu to status area
	    userMenu.menu.addMenuItem(this.settingsCenterMenu, index + 1);

	    let i = 0;

	    //Replace System Settings Menu if defined
	    if (this.replaceMenu)
	    {
		menuItems[index].destroy();
		
		let item = new PopupMenu.PopupMenuItem(_("System Settings"));
		item.connect("activate", Lang.bind(this, this.onPreferencesActivate));
		this.settingsCenterMenu.menu.addMenuItem(item, i++);
	    }

	    //Add others menus
	    for (let indexItem in this.items)
	    {
		let menuItem = new PopupMenu.PopupMenuItem(_(this.items[indexItem]["label"]), 0);
		menuItem.connect("activate", Lang.bind(this, this.launch, this.items[indexItem]));
		
		this.settingsCenterMenu.menu.addMenuItem(menuItem, i++);
	    }       
	    
	    this.settingSignals.push(this.settings.connect("changed::label-menu", Lang.bind(this, this.onParamChanged)));
	}

	this.settingSignals.push(this.settings.connect("changed::replace-ss-menu", Lang.bind(this, this.onParamChanged)));
	this.settingSignals.push(this.settings.connect("changed::items", Lang.bind(this, this.onParamChanged)));
    },

    disable: function()
    {
        let userMenu = Main.panel._statusArea.userMenu;

	//Remove setting Signals
	this.settingSignals.forEach(
	    function(signal)
	    {
                this.settings.disconnect(signal);
	    },
            this
        );
	this.settingSignals = null;

	//Find new menu position
        let index = null;
        let menuItems = userMenu.menu._getMenuItems();
        for (let i = 0; i < menuItems.length; i++)
        {    
	    if (menuItems[i] == this.settingsCenterMenu)
	    {
                index = i;
                break;
	    }
        }

	if (index == null)
	    return;

	//Add original menu if necessary
	if (this.replaceMenu)
	{
            let item = new PopupMenu.PopupMenuItem(_("System Settings"));
            item.connect("activate", Lang.bind(this, this.onPreferencesActivate));
	    userMenu.menu.addMenuItem(item, index);
	}
	
	//Remove new menu
	if (this.settingsCenterMenu != null)
	{
            this.settingsCenterMenu.destroy();
	    this.settingsCenterMenu = null;
	}
    }
}
