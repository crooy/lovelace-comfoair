/**
 * ComfoAir WTW card for Home Assistant Lovelace.
 *
 * Works with the ESPHome ComfoAir/WHR integration entities
 * (https://github.com/svenar-iot/esphome-comfoair).
 *
 * All entities are derived from a configurable prefix (default: `wtw`):
 *   sensor.<prefix>_outside_temperature, binary_sensor.<prefix>_bypass_open, ...
 * The climate entity (for the target temperature) is configurable separately.
 *
 * A visual editor is included: add the card via the UI and pick the
 * climate entity + prefix there.
 */

const CARD_VERSION = '2.0.0';

/** Image shipped next to this script; works for both /local and /hacsfiles installs. */
const DEFAULT_IMAGE = new URL('comfoair_heat.png', import.meta.url).href;

class ComfoAirCard extends HTMLElement {
  static getStubConfig(hass) {
    const climates = hass
      ? Object.keys(hass.states || {}).filter((id) => id.startsWith('climate.'))
      : [];
    const entity =
      climates.find((id) => /wtw|comfoair/i.test(id)) || climates[0] || 'climate.wtw';
    return { entity, prefix: 'wtw' };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('comfoair-card: expected a configuration object');
    }
    const prefix = String(config.prefix || 'wtw').trim() || 'wtw';
    this._config = {
      prefix,
      entity: config.entity || this._detectClimate(prefix),
      title: config.title || '',
      image: config.image === 'none' ? '' : config.image,
    };
    if (this._hass) this._render();
  }

  async getConfigElement() {
    const editor = document.createElement('comfoair-card-editor');
    editor.hass = this._hass;
    editor.setConfig(this._config || {});
    return editor;
  }

  getCardSize() {
    return 7;
  }

  _detectClimate(prefix) {
    const states = this._hass ? this._hass.states : {};
    const direct = `climate.${prefix}`;
    if (states[direct]) return direct;
    const ids = Object.keys(states).filter((id) => id.startsWith('climate.'));
    return (
      ids.find((id) => id.includes(`${prefix}_`)) ||
      ids.find((id) => /wtw|comfoair/i.test(id)) ||
      direct
    );
  }

  /** Entity id for a domain + sensor name using the configured prefix. */
  _e(domain, name) {
    return `${domain}.${this._config.prefix}_${name}`;
  }

  _s(entity, fallback = '–') {
    const st = this._hass ? this._hass.states[entity] : null;
    if (!st || st.state === 'unknown' || st.state === 'unavailable') return fallback;
    return st.state;
  }

  _int(entity, fallback = '–') {
    const raw = this._s(entity, null);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? String(Math.trunc(n)) : fallback;
  }

  _isOn(entity) {
    return this._s(entity, 'off') === 'on';
  }

  _climateTemp() {
    const st =
      this._config.entity && this._hass ? this._hass.states[this._config.entity] : null;
    if (!st) return '–';
    const t = Number(st.attributes && st.attributes.temperature);
    return Number.isFinite(t) ? String(Math.round(t * 10) / 10) : '–';
  }

  _render() {
    if (!this._hass || !this._config) return;

    const outsideTemp = this._s(this._e('sensor', 'outside_temperature'));
    const exhaustTemp = this._s(this._e('sensor', 'exhaust_temperature'));
    const returnTemp = this._s(this._e('sensor', 'return_temperature'));
    const supplyTemp = this._s(this._e('sensor', 'supply_temperature'));

    const intakeRpm = this._int(this._e('sensor', 'intake_fan_rpm'));
    const exhaustRpm = this._int(this._e('sensor', 'exhaust_fan_rpm'));
    const ventLevel = this._int(this._e('sensor', 'ventilation_level'));
    const supplyAir = this._int(this._e('sensor', 'supply_air_level'));
    const returnAir = this._int(this._e('sensor', 'return_air_level'));

    const fanActive = this._isOn(this._e('binary_sensor', 'supply_fan_active'));
    const filterOk =
      String(this._s(this._e('sensor', 'filter_status'), '')).trim().toLowerCase() === 'ok';
    const bypassActive = this._isOn(this._e('binary_sensor', 'bypass_open'));

    const valveState = this._s(this._e('sensor', 'preheating_valve'), '');
    const preHeatActive = valveState !== '' && valveState !== 'Closed';

    const summerMode = this._isOn(this._e('binary_sensor', 'summer_mode'));

    const image = this._config.image || DEFAULT_IMAGE;
    const bgStyle = image ? `background-image: url("${image}");` : '';
    const header = this._config.title
      ? `<div class="card-header">${this._config.title}</div>`
      : '';

    this.shadowRoot.innerHTML = `
      <style>
        .container { padding: 10px; }
        .bg {
          ${bgStyle}
          height: 200px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position-y: center;
        }
        .flex-container {
          display: flex;
          justify-content: space-between;
          height: 100%;
        }
        .flex-col-main {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 30px 0px;
          font-size: large;
          text-align: center;
          font-weight: bold;
        }
        .flex-col-out, .flex-col-in {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .fan-state { padding-top: 15px; }
        .info-row {
          background: rgba(0, 0, 0, 0.2);
          margin-top: 10px;
          padding: 5px;
          border-top: rgba(0, 0, 0, 0.4);
          -webkit-box-shadow: 0px -4px 3px rgba(50, 50, 50, 0.75);
          -moz-box-shadow: 0px -4px 3px rgba(50, 50, 50, 0.75);
          box-shadow: 0px -2.5px 3px rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: space-around;
        }
        .inactive { opacity: 0.7; }
        .warning  { color: #d80707db; }
      </style>
      <ha-card>
        ${header}
        <div class="container">
          <div class="bg">
            <div class="flex-container">

              <div class="flex-col-out">
                <div>Outside: ${outsideTemp}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${intakeRpm} RPM
                </div>
                <div>Exhaust: ${exhaustTemp}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${exhaustRpm} RPM
                </div>
              </div>

              <div class="flex-col-main">
                <div><ha-icon icon="mdi:home-thermometer"></ha-icon>
                  ${this._climateTemp()}°C</div>
                <div><ha-icon icon="mdi:fan"></ha-icon>
                  ${ventLevel}</div>
              </div>

              <div class="flex-col-in">
                <div>Return: ${returnTemp}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${returnAir}%
                </div>
                <div>Supply: ${supplyTemp}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${supplyAir}%
                </div>
              </div>

            </div>
          </div>
        </div>
        <div class="info-row">
          <ha-icon
            title="${fanActive ? 'Intake Fan Active' : 'Intake Fan Inactive'}"
            class="${fanActive ? '' : 'inactive'}"
            icon="mdi:fan">
          </ha-icon>
          <ha-icon
            title="${filterOk ? 'Filters are OK' : 'Filter Warning!'}"
            class="${filterOk ? '' : 'warning'}"
            icon="mdi:air-filter">
          </ha-icon>
          <ha-icon
            title="${bypassActive ? 'Bypass Active' : 'Bypass Inactive'}"
            class="${bypassActive ? '' : 'inactive'}"
            icon="mdi:electric-switch">
          </ha-icon>
          <ha-icon
            title="${preHeatActive ? 'Valve Preheating Active' : 'Valve Preheating Inactive'}"
            class="${preHeatActive ? '' : 'inactive'}"
            icon="mdi:radiator">
          </ha-icon>
          <ha-icon
            title="${summerMode ? 'Summer Mode' : 'Winter Mode'}"
            class="${summerMode ? 'inactive' : ''}"
            icon="${summerMode ? 'mdi:weather-sunny' : 'mdi:snowflake'}">
          </ha-icon>
        </div>
      </ha-card>
    `;
  }
}

class ComfoAirCardEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  setConfig(config) {
    this._config = config || {};
    if (this._form) this._form.data = this._config;
  }

  connectedCallback() {
    if (!this._form) this._render();
  }

  _render() {
    this.innerHTML = '';
    const form = document.createElement('ha-form');
    form.hass = this._hass;
    form.data = this._config;
    form.schema = [
      { name: 'entity', selector: { entity: { filter: { domain: 'climate' } } } },
      { name: 'prefix', selector: { text: {} } },
      { name: 'title', selector: { text: {} } },
      { name: 'image', selector: { text: {} } },
    ];
    form.computeLabel = (schema) =>
      ({
        entity: 'Climate entity',
        prefix: 'Entity prefix',
        title: 'Card title (optional)',
        image: 'Background image URL (optional)',
      }[schema.name]);
    form.computeHelper = (schema) =>
      ({
        entity: 'Used for the target temperature. Leave empty to auto-detect.',
        prefix:
          'Sensors are read as sensor.<prefix>_… and binary_sensor.<prefix>_… ' +
          '(default: wtw).',
        title: 'Shown above the card.',
        image: 'Defaults to the bundled drawing. Use "none" to hide it.',
      }[schema.name]);
    form.addEventListener('value-changed', (ev) => {
      ev.stopPropagation();
      this._config = { ...this._config, ...ev.detail.value };
      this.dispatchEvent(
        new CustomEvent('config-changed', {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        })
      );
    });
    this.appendChild(form);
    this._form = form;
  }
}

customElements.define('comfoair-card-editor', ComfoAirCardEditor);
customElements.define('comfoair-card', ComfoAirCard);
// Backwards compatibility with installs configured as `custom:wtw-card`.
if (!customElements.get('wtw-card')) {
  customElements.define('wtw-card', ComfoAirCard);
}

console.info(
  `%c WTW-COMFOAIR-CARD %c v${CARD_VERSION} `,
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;'
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'comfoair-card',
  name: 'ComfoAir WTW Card',
  description:
    'ComfoAir/WHR ventilation card for the ESPHome ComfoAir integration. ' +
    'Configurable entity prefix + climate entity, with a visual editor.',
});
