# Todoist Indicator - GNOME Shell Extension

> [!NOTE]  
> This is a fork from [Tarelda's todoist-indicator extension](https://github.com/tarelda/todoist-indicator), which itself was forked from the original [todoist-gnome-shell-extension](https://github.com/ubuntudroid/todoist-gnome-shell-extension) project.

A simple, unofficial Todoist extension for GNOME Shell that displays the count of open tasks in the top panel and provides quick access to your past due and today's tasks through a convenient dropdown menu.

![Screenshot](assets/todoist-gnome-shell-extension.png?raw=true "Todoist Indicator Screenshot")

## Features

- **Task Counter**: Shows the number of currently open tasks in the top panel
- **Quick Access Dropdown**: View and interact with your past due and today's tasks
- **Task Management**: Click on tasks to mark them as completed
- **Automatic Sync**: Updates every 60 seconds to keep your task count current
- **Smart Sorting**: Past due tasks sorted by project, today's tasks in Todoist order

## Specifications

- **Language**: JavaScript (96.7%), Shell (2%), CSS (1.3%)
- **License**: MIT License
- **GNOME Shell Version**: 46
- **Extension UUID**: `todoist-indicator@may8326.github.com`

## Compatibility

This extension is compatible with:
- **GNOME Shell**: Version 46
- **Operating System**: Linux distributions with GNOME Shell
- **Todoist Account**: Requires a valid Todoist account and API token

## Prerequisites

Before installing this extension, ensure you have:

1. **GNOME Shell 46** installed on your system
2. **Git** for cloning the repository
3. **Active Todoist account** with API access
4. **Todoist API Token** (obtainable from Todoist settings)

## Installation

### Method 1: Manual Installation (Recommended)

1. **Clone the repository** to your GNOME Shell extensions directory:
   ```bash
   git clone https://github.com/May8326/todoist-indicator.git ~/.local/share/gnome-shell/extensions/todoist-indicator@may8326.github.com
   ```

   > **Important**: The directory name `todoist-indicator@may8326.github.com` is crucial for GNOME Shell to recognize the extension.

2. **Restart GNOME Shell**:
   - Press `Alt + F2`
   - Type `r` and press Enter
   - Or log out and log back in

3. **Enable the extension**:
   - Navigate to https://extensions.gnome.org/local/
   - Find "Todoist" in the list and toggle it ON
   - Click on the settings/gear icon to configure

4. **Configure your API token**:
   - In the extension settings, enter your Todoist API token
   - The extension will start syncing within 60 seconds

### Method 2: Direct Download

1. Download the latest release from the [releases page](https://github.com/May8326/todoist-indicator/releases)
2. Extract to `~/.local/share/gnome-shell/extensions/todoist@tarelda.github.com`
3. Follow steps 2-4 from Method 1

## Getting Your Todoist API Token

1. Log in to your Todoist account
2. Go to Todoist Settings → Integrations
3. Find your API token in the "API token" section
4. Copy the token and paste it in the extension settings

## Configuration

The extension offers the following configuration options:

- **API Token**: Your personal Todoist API token (required)
- **Sync Interval**: Currently set to 60 seconds (default)
- **Task Views**: Toggle between past due and today's tasks

## Usage

1. Once configured, the extension will display your open task count in the top panel
2. Click on the indicator to open the dropdown menu
3. View your past due and today's tasks
4. Click on any task to mark it as completed
5. The counter updates automatically every minute

## Development & Customization

### File Structure
```
todoist-indicator@may8326.github.com/
├── extension.js          # Main extension logic
├── metadata.json         # Extension metadata
├── prefs.js             # Preferences dialog
├── schemas/             # Settings schema
├── assets/              # Screenshots and icons
└── locale/              # Translation files
```

### Adding Translations

See the `scripts/translation_example.sh` for instructions on adding new translations.

## Troubleshooting

### Extension Not Appearing
- Ensure the directory is named exactly `todoist-indicator@may8326.github.com`
- Restart GNOME Shell after installation
- Check that you're using GNOME Shell 46

### Tasks Not Syncing
- Verify your API token is correct
- Check your internet connection
- Wait up to 60 seconds for the first sync after setting the token

### Permission Issues
- Ensure the extension directory has proper permissions:
  ```bash
  chmod -R 755 ~/.local/share/gnome-shell/extensions/todoist-indicator@may8326.github.com
  ```

## Roadmap

- [ ] Add more language translations
- [ ] Improve error handling and user feedback
- [ ] Implement system notifications for due tasks
- [ ] Submit to GNOME Extensions store
- [ ] Make task sorting configurable
- [ ] Add keyboard shortcuts
- [ ] Support for custom task filters

## Contributing

Contributions are welcome! Please feel free to:

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

This project builds upon the excellent work of several developers and projects:

- **Original Fork**: [Tarelda's todoist-indicator](https://github.com/tarelda/todoist-indicator)
- **Original Project**: [ubuntudroid/todoist-gnome-shell-extension](https://github.com/ubuntudroid/todoist-gnome-shell-extension)
- **Inspiration from**:
  - [gnome-shell-tw](http://smasue.github.io/gnome-shell-tw)
  - [gnome-shell-extension-docker](https://github.com/gpouilloux/gnome-shell-extension-docker)
  - [timepp gnome shell extension](https://github.com/zagortenay333/timepp__gnome)
  - [gnodoist-gnome-shell-extension](https://github.com/pringlized/gnodoist-gnome-shell-extension)

### Documentation & Resources
- [GNOME Shell Extensions Writing Guide](https://wiki.gnome.org/Projects/GnomeShell/Extensions/Writing)
- [GJS API Documentation](https://gjs-docs.gnome.org)
- [Making GNOME Shell Plugins Save Their Config](http://www.mibus.org/2013/02/15/making-gnome-shell-plugins-save-their-config/)

Special thanks to all the contributors and maintainers of these projects! 🙏

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/May8326/todoist-indicator/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible, including:
   - GNOME Shell version
   - Operating system
   - Error messages (if any)
   - Steps to reproduce the issue

---

**Made with ❤️ for the GNOME and Todoist communities**
