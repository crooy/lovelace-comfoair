# Homeassistant Lovelace Comfoair card

Use [https://github.com/svenar-iot/esphome-comfoair](https://github.com/svenar-iot/esphome-comfoair) to connect your ComfoAir to Homeassistant and then use this lovelace card to visualize your data!

![Image](https://raw.githubusercontent.com/wichers/lovelace-comfoair/master/result.png)

# Manual installation

* Clone this repo into your `www` folder inside your configuration. So it will be: `config_folder/www/lovelace-comfoair`.
* Edit your lovelace-ui.yaml or use the flat configuration mode in lovelace and add to the top:
```
resources:
  - type: module
    url: /local/lovelace-comfoair/comfoair-card.js
```
* Add a card with `type: 'custom:comfoair-card'` to your UI, or just use the visual card editor.
* Restart home assistant

# Configuration

All sensors are derived from a configurable `prefix` (default `wtw`), so the card
reads `sensor.<prefix>_outside_temperature`, `binary_sensor.<prefix>_bypass_open`, etc.

| Option | Default | Description |
|---|---|---|
| `entity` | auto-detected | Climate entity used for the target temperature (e.g. `climate.wtw`) |
| `prefix` | `wtw` | Entity prefix of the ComfoAir/WHR sensors |
| `title` | *(empty)* | Optional card title |
| `image` | bundled drawing | Background image URL; `none` hides it |

Example:

```yaml
type: custom:comfoair-card
entity: climate.wtw
prefix: wtw
title: WTW
```
* ???
* Profit!

# HACS installation

If you prefer to manage the card via HACS:

1. Open HACS in Home Assistant and add `https://github.com/svenar-iot/lovelace-comfoair` as a **Custom Repository** in the **Dashboard** category.
2. Find **Comfoair ventilation lovelace component** in the list of custom repositories and install it.
3. Make sure the following resource is added to your configuration:
   ```yaml
   url: /hacsfiles/lovelace-comfoair/comfoair-card.js
   type: module
   ```
4. Use the card with `type: 'custom:comfoair-card'` and configure it in the visual editor (climate entity + prefix), or via YAML as shown above.

