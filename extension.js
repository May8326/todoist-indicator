import St from 'gi://St';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Polyfill for Array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      var len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var thisArg = arguments[1];
      var k = 0;
      while (k < len) {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        k++;
      }
      return -1;
    }
  });
}

// UUID Generator
const rnds8 = new Uint8Array(16);
function rng() {
  return rnds8.map(byte => GLib.random_int_range(0, 0xFF));
}

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  const uuid = (
    byteToHex[arr[offset + 0]] +
    byteToHex[arr[offset + 1]] +
    byteToHex[arr[offset + 2]] +
    byteToHex[arr[offset + 3]] +
    '-' +
    byteToHex[arr[offset + 4]] +
    byteToHex[arr[offset + 5]] +
    '-' +
    byteToHex[arr[offset + 6]] +
    byteToHex[arr[offset + 7]] +
    '-' +
    byteToHex[arr[offset + 8]] +
    byteToHex[arr[offset + 9]] +
    '-' +
    byteToHex[arr[offset + 10]] +
    byteToHex[arr[offset + 11]] +
    byteToHex[arr[offset + 12]] +
    byteToHex[arr[offset + 13]] +
    byteToHex[arr[offset + 14]] +
    byteToHex[arr[offset + 15]]
  ).toLowerCase();
  return uuid;
}

let _nodeId;
let _clockseq;
let _lastMSecs = 0;
let _lastNSecs = 0;

function UuidV1(options, buf, offset) {
  let i = (buf && offset) || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || rng)();
    if (node == null) {
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1],
        seedBytes[2],
        seedBytes[3],
        seedBytes[4],
        seedBytes[5],
      ];
    }
    if (clockseq == null) {
      clockseq = _clockseq = ((seedBytes[6] << 8) | seedBytes[7]) & 0x3fff;
    }
  }

  let msecs = options.msecs !== undefined ? options.msecs : Date.now();
  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000;

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = (clockseq + 1) & 0x3fff;
  }
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }
  if (nsecs >= 10000) {
    return undefined;
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  msecs += 12219292800000;
  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = (tl >>> 24) & 0xff;
  b[i++] = (tl >>> 16) & 0xff;
  b[i++] = (tl >>> 8) & 0xff;
  b[i++] = tl & 0xff;

  const tmh = ((msecs / 0x100000000) * 10000) & 0xfffffff;
  b[i++] = (tmh >>> 8) & 0xff;
  b[i++] = tmh & 0xff;
  b[i++] = ((tmh >>> 24) & 0xf) | 0x10;
  b[i++] = (tmh >>> 16) & 0xff;
  b[i++] = (clockseq >>> 8) | 0x80;
  b[i++] = clockseq & 0xff;

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || stringify(b);
}

// Todoist API
const APIURL = 'https://todoist.com/API/v9';

const ObjectColors = new Map([
  ["berry_red", "#b8256f"],
  ["red", "#db4035"],
  ["orange", "#ff9933"],
  ["yellow", "#fad000"],
  ["olive_green", "#afb83b"],
  ["lime_green", "#7ecc49"],
  ["green", "#299438"],
  ["mint_green", "#6accbc"],
  ["teal", "#158fad"],
  ["sky_blue", "#14aaf5"],
  ["light_blue", "#96c3eb"],
  ["blue", "#4073ff"],
  ["grape", "#884dff"],
  ["violet", "#af38eb"],
  ["lavender", "#eb96eb"],
  ["magenta", "#e05194"],
  ["salmon", "#ff8d85"],
  ["charcoal", "#808080"],
  ["grey", "#b8b8b8"],
  ["taupe", "#ccac93"],
]);

class TodoistAPI {
  constructor(token) {
    this._token = token;
    this._syncToken = "*";
    this._session = new Soup.Session();
  }

  sync(resource_types, on_success, on_failure) {
    let params = {
      sync_token: this._syncToken,
      resource_types: JSON.stringify(resource_types)
    };
    let request = Soup.Message.new_from_encoded_form('POST', APIURL + "/sync", Soup.form_encode_hash(params));
    request.get_request_headers().append("Authorization", "Bearer " + this._token);

    this._session.send_and_read_async(request, GLib.PRIORITY_DEFAULT, null, (session, result) => {
      try {
        let response = session.send_and_read_finish(result);
        if (request.get_status() !== 200) {
          on_failure(request);
          return;
        }
        let data = JSON.parse(new TextDecoder().decode(response.get_data()));
        this._syncToken = data.sync_token;
        on_success(data);
      } catch (e) {
        on_failure(request);
      }
    });
  }

  execute(commands, on_success, on_failure) {
    let params = {
      commands: JSON.stringify(commands)
    };

    let request = Soup.Message.new_from_encoded_form('POST', APIURL + "/sync", Soup.form_encode_hash(params));
    request.get_request_headers().append("Authorization", "Bearer " + this._token);

    this._session.send_and_read_async(request, GLib.PRIORITY_DEFAULT, null, (session, result) => {
      try {
        let response = session.send_and_read_finish(result);
        if (request.get_status() !== 200) {
          on_failure();
          return;
        }

        let data = JSON.parse(new TextDecoder().decode(response.get_data()));
        let hasFailed = false;
        commands.forEach(function(command) {
          if (data.sync_status[command.uuid] !== "ok")
            hasFailed = true;
        });

        if (on_failure && hasFailed) on_failure(data);
        else if (on_success) on_success(data);
      } catch (e) {
        on_failure();
      }
    });
  }

  destroy() {
    if (this._session != undefined)
      this._session.abort();
    this._session = undefined;
  }
}

let TodoistTaskMenuItem = GObject.registerClass(
  class TodoistTaskMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(task, projects, on_activation, params) {
        super._init(params);
        this.add_style_class_name("check-box");
        this.add_style_class_name("todoist-indicator-container-task");

        let box = new St.Bin();
        let label = new St.Label({ text: task.content });

        this.add_child(box);
        this.add_child(label);

        if (projects instanceof Array) {
          projects.forEach((project) => {
            let label = new St.Label({
              text: project.name === "Inbox" ? _("Inbox") : project.name,
              style_class: "todoist-indicator-container-task-project-label",
            });
            if (ObjectColors.has(project.color))
              label.set_style("color: " + ObjectColors.get(project.color) + ";");
            this.add_child(label);
          }, this);
        }

        this.connect("activate", (actor, event, data) => {
          this.add_style_pseudo_class("checked");
          if(on_activation)
            on_activation(task, () => this.destroy(), () => this.remove_style_pseudo_class("checked"));
        });
    }
  }
);

const TodoistIndicator = GObject.registerClass(
  class TodoistIndicator extends PanelMenu.Button {
    _init(settings) {
      super._init(0.0, "Todoist Indicator");

      this._settings = settings;
      this._api = new TodoistAPI(this._settings.get_string("api-token"));
      this._tasks = [];
      this._projects = [];

      this.buttonText = new St.Label({
        text: _("Loading..."),
        y_align: Clutter.ActorAlign.CENTER
      });
      this.add_child(this.buttonText);

      this._container = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        y_expand: true,
        style_class: "todoist-indicator-container"
      });

      this.menu.box.add_child(this._container);
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let refreshButton = new PopupMenu.PopupMenuItem(_("Refresh"));
      refreshButton.connect("activate", this._refresh.bind(this));
      this.menu.addMenuItem(refreshButton);

      let openTodoistWebButton = new PopupMenu.PopupMenuItem(_("Open todoist.com"));
      openTodoistWebButton.connect("activate", () => {
        Util.spawn(['xdg-open', 'https://todoist.com/app#agenda%2Foverdue%2C%20today']);
      });
      this.menu.addMenuItem(openTodoistWebButton);

      this._refresh();
      this._refreshTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._settings.get_int("refresh-interval"), () => {
        this._refresh();
        return GLib.SOURCE_CONTINUE;
      });
    }

    _refresh() {
      let apiCallback = (data) => {
        if (data == undefined) {
          this._renderError(_("Connection error"));
          return;
        }

        this._parseProjects(data.projects);
        this._parseTasks(data.items);
        this._render();
      };

      this._api.sync(["items", "projects"], apiCallback, (msg) => {
        console.log("sync have failed");
      });
      return true;
    }

    _isDoneOrDeletedOrArchived(item) {
      return item.checked === true || item.is_deleted === true || item.in_history === true;
    }

    _isDeletedOrArchived(item) {
      return item.is_deleted === true || item.is_archived === true;
    }

    _isNotDone(item) {
      return item.checked === false;
    }

    _isDueDateToday(item) {
      if (item.due === null) return false;

      let dueDate = new Date(item.due.date);
      dueDate.setHours(0,0,0,0);
      let today_min = new Date(), today_max = new Date();
      today_min.setHours(0,0,0,0);
      today_max.setHours(23,59,59,999);

      return (dueDate >= today_min) && (dueDate <= today_max);
    }

    _isDueDateInPast(item) {
      if (item.due === null) return false;

      let dueDate = new Date(item.due.date);
      dueDate.setHours(0,0,0,0);
      let today = new Date();
      today.setHours(0,0,0,0);

      return dueDate < today;
    }

    _closeTask(task, on_success, on_failure) {
      let uuid = UuidV1();
      let commands = [
        {
          uuid: uuid,
          type: "item_close",
          args: {
            id: task.id
          }
        }
      ];

      this._api.execute(commands, on_success, data => {
        console.log("close task command failed with error " + data.sync_status[uuid]["error"]);
        on_failure();
      });
    }

    _parseTasks(tasks) {
      let undoneTasks = tasks.filter(this._isNotDone.bind(this));
      if (this._tasks.length == 0) {
        this._tasks = undoneTasks;
        return;
      }

      undoneTasks.forEach((item) => {
        let index = this._tasks.findIndex(openItem => openItem.id === item.id);
        if (index === -1)
          this._tasks.splice(this._tasks.length, 0, item);
        else
          this._tasks[index] = item;
      });

      let doneTasks = tasks.filter(this._isDoneOrDeletedOrArchived.bind(this));
      doneTasks.forEach((item) => {
        let index = this._tasks.findIndex(openItem => openItem.id === item.id);
        if (index > -1)
          this._tasks.splice(index, 1);
      });
    }

    _parseProjects(projects) {
      let activeProjects = projects.filter(item => !this._isDeletedOrArchived(item));
      if (this._projects.length == 0) {
        this._projects = activeProjects;
        return;
      }

      projects.forEach((item) => {
        let index = this._projects.findIndex(existingItem => existingItem.id === item.id);
        if (index > -1) {
          if (this._isDeletedOrArchived(item))
            this._projects.splice(index, 1);
          else
            this._projects[index] = item;
        } else {
          this._projects.push(item);
        }
      });
    }

    _getTextForTaskCount(count) {
      switch (count) {
        case 0: return _("no due tasks");
        default: return ngettext("one due task", "%d due tasks", count).format(count);
      }
    }

    _renderTodoLists(pastDueItems, todayItems) {
      this._container.destroy_all_children();

      if (pastDueItems.length > 0) {
        this._container.add_child(new St.Label({
          text: _("PAST DUE"),
          style_class: "todoist-indicator-container-section-label",
        }));

        let pastDueContainer = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          y_expand: true
        });

        pastDueItems.sort((a, b) => a.project_id - b.project_id);

        pastDueItems.forEach((item) => {
          let menuItem = new TodoistTaskMenuItem(item, this._projects.filter(project => project.id === item.project_id), this._closeTask.bind(this));
          pastDueContainer.add_child(menuItem);
        });

        this._container.add_child(pastDueContainer);
      }

      if (todayItems.length > 0) {
        this._container.add_child(new St.Label({
          text: _("TODAY"),
          style_class: "todoist-indicator-container-section-label"
        }));

        let todayContainer = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          y_expand: true
        });

        todayItems.sort((a, b) => a.day_order - b.day_order);

        todayItems.forEach((item) => {
          let menuItem = new TodoistTaskMenuItem(item, this._projects.filter(project => project.id === item.project_id), this._closeTask.bind(this));
          todayContainer.add_child(menuItem);
        });

        this._container.add_child(todayContainer);
      }
    }

    _render() {
      let pastDueItems = this._tasks.filter(this._isDueDateInPast.bind(this));
      let todayItems = this._tasks.filter(this._isDueDateToday.bind(this));

      // Calculer le total des tâches overdue + today
      let totalDueTasks = pastDueItems.length + todayItems.length;
  
      this.buttonText.set_text(this._getTextForTaskCount(totalDueTasks));
      this._renderTodoLists(pastDueItems, todayItems);
    }

    _renderError(errorMsg) {
      this.menu.box.destroy_all_children();
      this.buttonText.set_text(errorMsg);
    }

    stop() {
      if (this._refreshTimer) {
        GLib.source_remove(this._refreshTimer);
        this._refreshTimer = undefined;
      }

      this.menu.box.destroy_all_children();
      this._api.destroy();
    }
  }
);

export default class TodoistExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicator = null;
  }

  enable() {
    this._indicator = new TodoistIndicator(this.getSettings());
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator?.stop();
    this._indicator?.destroy();
    this._indicator = null;
  }
}