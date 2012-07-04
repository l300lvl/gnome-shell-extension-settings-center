const St = imports.gi.St;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;

const PopupSubMenuMenuItem = new Lang.Class({
    Name: 'PopupSubMenuMenuItem_SettingsCenter',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function(text) {
        this.parent(text);

        this.removeActor(this._triangle);
        this.addActor(this._triangle, { span: -1, align: St.Align.END })
    }
});
