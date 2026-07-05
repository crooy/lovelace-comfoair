class ComfoAirCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _s(entity) {
    return this._hass.states[entity]?.state ?? 'N/A';
  }

  _render() {
    if (!this._hass) return;

    const s = (e) => this._s(e);

    const fanActive     = this._hass.states['binary_sensor.comfoair_supply_fan_active']?.state === 'on';
    const filterOk      = s('sensor.comfoair_filter_status') === 'Ok';
    const bypassActive  = this._hass.states['binary_sensor.comfoair_bypass_open']?.state === 'on';
    const valveState    = this._hass.states['sensor.comfoair_preheating_valve']?.state;
    const preHeatActive = valveState !== undefined && valveState !== 'Closed';
    const summerMode    = this._hass.states['binary_sensor.comfoair_summer_mode']?.state === 'on';

    this.shadowRoot.innerHTML = `
      <style>
        .container { padding: 10px; }
        .bg {
          background-image: url("/hacsfiles/lovelace-comfoair/comfoair_heat.png");
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
        .flex-col-out {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .flex-col-in {
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
        <div class="container">
          <div class="bg">
            <div class="flex-container">

              <div class="flex-col-out">
                <div>Outside: ${s('sensor.comfoair_outside_temperature')}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${Math.trunc(Number(s('sensor.comfoair_intake_fan_rpm')))} RPM
                </div>
                <div>Exhaust: ${s('sensor.comfoair_exhaust_temperature')}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${Math.trunc(Number(s('sensor.comfoair_exhaust_fan_rpm')))} RPM
                </div>
              </div>

              <div class="flex-col-main">
                <div><ha-icon icon="mdi:home-thermometer"></ha-icon>
                  ${this._hass.states['climate.comfoair_comfoair']?.attributes?.temperature ?? 'N/A'}°C</div>
                <div><ha-icon icon="mdi:fan"></ha-icon>
                  ${Math.trunc(Number(s('sensor.comfoair_ventilation_level')))}</div>
              </div>

              <div class="flex-col-in">
                <div>Return: ${s('sensor.comfoair_return_temperature')}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${Math.trunc(Number(s('sensor.comfoair_return_air_level')))}%
                </div>
                <div>Supply: ${s('sensor.comfoair_supply_temperature')}°C</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  ${Math.trunc(Number(s('sensor.comfoair_supply_air_level')))}%
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

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 7;
  }
}

console.info("Loaded ComfoAir Controller WTW card.");

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'wtw-card',
  name: 'ComfoAir Controller WTW Card',
  description: 'ComfoAir Controller WTW Card (specifically works with WHR 930 entities)',
});

customElements.define('wtw-card', ComfoAirCard);