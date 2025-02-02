const assert = require('assert');
const _ = require('lodash');

const { Diagnostic } = require('../src/diagnostic');
const MQTT = require('../src/mqtt');
const Vehicle = require('../src/vehicle');
const apiResponse = require('./diagnostic.sample.json');

describe('MQTT', () => {
    let mqtt;
    let vehicle = new Vehicle({make: 'foo', model: 'bar', vin: 'XXX', year: 2020});
    beforeEach(() => mqtt = new MQTT(vehicle));

    it('should set defaults', () => {
        assert.strictEqual(mqtt.prefix, 'homeassistant');
        assert.strictEqual(mqtt.instance, 'XXX');
    });

    it('should convert names for mqtt topics', () => {
        assert.strictEqual(MQTT.convertName('foo bar'), 'foo_bar');
        assert.strictEqual(MQTT.convertName('foo bar bazz'), 'foo_bar_bazz');
        assert.strictEqual(MQTT.convertName('FOO BAR'), 'foo_bar');
        assert.strictEqual(MQTT.convertName('FOO BAR bazz'), 'foo_bar_bazz');
    });

    it('should convert names to be human readable', () => {
        assert.strictEqual(MQTT.convertFriendlyName('foo bar'), 'Foo Bar');
        assert.strictEqual(MQTT.convertFriendlyName('FOO BAR'), 'Foo Bar');
    });

    it('should determine sensor types', () => {
        assert.strictEqual(MQTT.determineSensorType('EV CHARGE STATE'), 'binary_sensor');
        assert.strictEqual(MQTT.determineSensorType('EV PLUG STATE'), 'binary_sensor');
        assert.strictEqual(MQTT.determineSensorType('PRIORITY CHARGE INDICATOR'), 'binary_sensor');
        assert.strictEqual(MQTT.determineSensorType('PRIORITY CHARGE STATUS'), 'binary_sensor');
        assert.strictEqual(MQTT.determineSensorType('getLocation'), 'device_tracker');
        assert.strictEqual(MQTT.determineSensorType('foo'), 'sensor');
        assert.strictEqual(MQTT.determineSensorType(''), 'sensor');
    });

    describe('topics', () => {
        let d;

        it('should generate availability topic', () => {
            assert.strictEqual(mqtt.getAvailabilityTopic(), 'homeassistant/XXX/available');
        });

        it('should generate command topic', () => {
            assert.strictEqual(mqtt.getCommandTopic(), 'homeassistant/XXX/command');
        });

        it('should generate polling status topic', () => {
            assert.strictEqual(mqtt.getPollingStatusTopic(), 'homeassistant/XXX/polling_status');
        });

        it('should generate refresh interval topic', () => {
            assert.strictEqual(mqtt.getRefreshIntervalTopic(), 'homeassistant/XXX/refresh_interval');
        });

        it('should generate command topic', () => {
            assert.strictEqual(mqtt.getRefreshIntervalCurrentValTopic(), 'homeassistant/XXX/refresh_interval_current_val');
        });

        it('should generate command topic', () => {
            assert.strictEqual(mqtt.getDeviceTrackerConfigTopic(), 'homeassistant/device_tracker/XXX/config');
        });

        describe('sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[0]')));

            it('should generate config topics', () => {
                assert.strictEqual(mqtt.getConfigTopic(d), 'homeassistant/sensor/XXX/ambient_air_temperature/config');
            });
            it('should generate state topics', () => {
                assert.strictEqual(mqtt.getStateTopic(d), 'homeassistant/sensor/XXX/ambient_air_temperature/state');
            });
        });

        describe('binary_sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[3]')));
            it('should generate config topics', () => {
                assert.strictEqual(mqtt.getConfigTopic(d), 'homeassistant/binary_sensor/XXX/ev_charge_state/config');
            });
            it('should generate state topics', () => {
                assert.strictEqual(mqtt.getStateTopic(d.diagnosticElements[1]), 'homeassistant/binary_sensor/XXX/priority_charge_indicator/state');
            });
        });
    });

    describe('payloads', () => {
        let d;
        describe('sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[0]')));
            it('should generate config payloads', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    //message: 'na',
                    state_class: 'measurement',
                    device_class: 'temperature',
                    json_attributes_template: undefined,
                    name: 'Ambient Air Temperature',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/ambient_air_temperature/state',
                    unique_id: 'xxx-ambient-air-temperature',
                    json_attributes_topic: undefined,
                    unit_of_measurement: '°C',
                    value_template: '{{ value_json.ambient_air_temperature }}'
                });
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[1]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    //message: 'na',
                    state_class: 'measurement',
                    device_class: 'temperature',
                    json_attributes_template: undefined,
                    name: 'Ambient Air Temperature F',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/ambient_air_temperature/state',
                    unique_id: 'xxx-ambient-air-temperature-f',
                    json_attributes_topic: undefined,
                    unit_of_measurement: '°F',
                    value_template: '{{ value_json.ambient_air_temperature_f }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    ambient_air_temperature: 15,
                    ambient_air_temperature_f: 59,
                    ambient_air_temperature_f_message: 'na',
                    ambient_air_temperature_message: 'na'
                    //ambient_air_temperature: 15,
                    //ambient_air_temperature_f: 59
                });
            });
        });

        describe('sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[7]')));
            it('should generate config payloads', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'total_increasing',
                    device_class: 'distance',
                    json_attributes_template: undefined,
                    name: 'Odometer',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/odometer/state',
                    unique_id: 'xxx-odometer',
                    json_attributes_topic: undefined,
                    unit_of_measurement: 'km',
                    value_template: '{{ value_json.odometer }}'
                });
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[1]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'total_increasing',
                    device_class: 'distance',
                    json_attributes_template: undefined,
                    name: 'Odometer Mi',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/odometer/state',
                    unique_id: 'xxx-odometer-mi',
                    json_attributes_topic: undefined,
                    unit_of_measurement: 'mi',
                    value_template: '{{ value_json.odometer_mi }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    odometer: 6013.8,
                    odometer_message: "na",
                    odometer_mi: 3736.8,
                    odometer_mi_message: "na"
                });
            });
        });

        describe('binary_sensor', () => { // TODO maybe not needed, payloads not diff
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[3]')));
            it('should generate config payloads', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[1]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    //message: 'na',                      
                    state_class: undefined,
                    device_class: undefined,
                    json_attributes_template: undefined,
                    name: 'Priority Charge Indicator',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    payload_off: false,
                    payload_on: true,
                    state_topic: 'homeassistant/binary_sensor/XXX/ev_charge_state/state',
                    unique_id: 'xxx-priority-charge-indicator',
                    json_attributes_topic: undefined,
                    value_template: '{{ value_json.priority_charge_indicator }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    ev_charge_state: false,
                    ev_charge_state_message: 'charging_complete',
                    priority_charge_indicator: false,
                    priority_charge_indicator_message: 'na',
                    priority_charge_status: false,
                    priority_charge_status_message: 'na'
                    //ev_charge_state: false,
                    //priority_charge_indicator: false,
                    //priority_charge_status: false
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[8]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    //message: 'YELLOW',
                    state_class: 'measurement',
                    device_class: 'pressure',
                    json_attributes_template: "{{ {'recommendation': value_json.tire_pressure_placard_front, 'message': value_json.tire_pressure_lf_message} | tojson }}",
                    name: 'Tire Pressure: Left Front',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/tire_pressure/state',
                    unique_id: 'xxx-tire-pressure-lf',
                    json_attributes_topic: 'homeassistant/sensor/XXX/tire_pressure/state',
                    unit_of_measurement: 'kPa',
                    value_template: '{{ value_json.tire_pressure_lf }}'
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[8]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[5]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    //message: 'YELLOW',
                    state_class: 'measurement',
                    device_class: 'pressure',
                    json_attributes_template: "{{ {'recommendation': value_json.tire_pressure_placard_rear, 'message': value_json.tire_pressure_rr_message} | tojson }}",
                    name: 'Tire Pressure: Right Rear',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/tire_pressure/state',
                    unique_id: 'xxx-tire-pressure-rr',
                    json_attributes_topic: 'homeassistant/sensor/XXX/tire_pressure/state',
                    unit_of_measurement: 'kPa',
                    value_template: '{{ value_json.tire_pressure_rr }}'
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[10]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    //message: 'YELLOW',
                    state_class: 'measurement',
                    device_class: undefined,
                    json_attributes_template: "{{ {'message': value_json.oil_life_message} | tojson }}",
                    name: 'Oil Life',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/oil_life/state',
                    unique_id: 'xxx-oil-life',
                    json_attributes_topic: 'homeassistant/sensor/XXX/oil_life/state',
                    unit_of_measurement: '%',
                    value_template: '{{ value_json.oil_life }}'
                });
            });
        });

        describe('sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[11]')));
            it('should generate config payloads', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'measurement',
                    device_class: 'volume_storage',
                    json_attributes_template: undefined,
                    name: 'Fuel Amount',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/fuel_tank_info/state',
                    unique_id: 'xxx-fuel-amount',
                    json_attributes_topic: undefined,
                    unit_of_measurement: 'L',
                    value_template: '{{ value_json.fuel_amount }}'
                });
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[1]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'measurement',
                    device_class: 'volume_storage',
                    json_attributes_template: undefined,
                    name: 'Fuel Capacity',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/fuel_tank_info/state',
                    unique_id: 'xxx-fuel-capacity',
                    json_attributes_topic: undefined,
                    unit_of_measurement: 'L',
                    value_template: '{{ value_json.fuel_capacity }}'
                });
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[2]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'measurement',
                    device_class: undefined,
                    json_attributes_template: undefined,
                    name: 'Fuel Level',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/fuel_tank_info/state',
                    unique_id: 'xxx-fuel-level',
                    json_attributes_topic: undefined,
                    unit_of_measurement: '%',
                    value_template: '{{ value_json.fuel_level }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    fuel_amount: 19.98,
                    fuel_amount_gal: 5.3,
                    fuel_amount_gal_message: "na",
                    fuel_amount_message: "na",
                    fuel_capacity: 60,
                    fuel_capacity_gal: 15.9,
                    fuel_capacity_gal_message: "na",
                    fuel_capacity_message: "na",
                    fuel_level: 33.3,
                    fuel_level_in_gal: 19.98,
                    fuel_level_in_gal_gal: 5.3,
                    fuel_level_in_gal_gal_message: "na",
                    fuel_level_in_gal_message: "na",
                    fuel_level_message: "na"
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[12]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'measurement',
                    device_class: undefined,
                    json_attributes_template: undefined,
                    name: 'Lifetime Fuel Econ',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/lifetime_fuel_econ/state',
                    unique_id: 'xxx-lifetime-fuel-econ',
                    json_attributes_topic: undefined,
                    unit_of_measurement: 'km/L',
                    value_template: '{{ value_json.lifetime_fuel_econ }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    lifetime_fuel_econ: 11.86,
                    lifetime_fuel_econ_message: "na",
                    lifetime_fuel_econ_mpg: 27.9,
                    lifetime_fuel_econ_mpg_message: "na"
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[13]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: 'total_increasing',
                    device_class: 'volume',
                    json_attributes_template: undefined,
                    name: 'Lifetime Fuel Used',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    state_topic: 'homeassistant/sensor/XXX/lifetime_fuel_used/state',
                    unique_id: 'xxx-lifetime-fuel-used',
                    json_attributes_topic: undefined,
                    unit_of_measurement: 'L',
                    value_template: '{{ value_json.lifetime_fuel_used }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    lifetime_fuel_used: 4476.94,
                    lifetime_fuel_used_gal: 1182.7,
                    lifetime_fuel_used_gal_message: "na",
                    lifetime_fuel_used_message: "na"
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[4]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    availability_topic: 'homeassistant/XXX/available',
                    device: {
                        identifiers: [
                            'XXX'
                        ],
                        manufacturer: 'foo',
                        model: 2020,
                        name: '2020 foo bar'
                    },
                    state_class: undefined,
                    device_class: 'plug',
                    json_attributes_template: undefined,
                    name: 'Ev Plug State',
                    payload_available: 'true',
                    payload_not_available: 'false',
                    payload_off: false,
                    payload_on: true,
                    state_topic: 'homeassistant/binary_sensor/XXX/ev_plug_state/state',
                    unique_id: 'xxx-ev-plug-state',
                    json_attributes_topic: undefined,
                    value_template: '{{ value_json.ev_plug_state }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    ev_plug_state: true,
                    ev_plug_state_message: "plugged"
                });
            });
        });


    });
});
