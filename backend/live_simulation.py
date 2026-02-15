import time
import random
import datetime
import pandas as pd

state = {
    "charger_output_voltage_V": 400.0,
    "charging_current_A": 50.0,
    "charging_power_kW": 20.0,
    "charger_load_kW": 18.0,
    "ambient_temperature_C": 30.0,
    "charger_internal_temperature_C": 45.0
}

def update_ambient_temperature(prev_temp):
    drift = random.uniform(-0.1, 0.1)
    return max(15, min(prev_temp + drift, 50))

def base_load_by_hour(hour):
    if 8 <= hour <= 11 or 17 <= hour <= 21:
        return 25
    return 12

def update_load():
    hour = datetime.datetime.now().hour
    noise = random.uniform(-2, 2)
    return max(0, base_load_by_hour(hour) + noise)

def update_voltage(prev_voltage, load, nominal=400):
    noise = random.uniform(-2, 2)             
    load_effect = -0.015 * load                
    recovery = 0.05 * (nominal - prev_voltage) 

    new_voltage = prev_voltage + noise + load_effect + recovery
    return max(360, min(new_voltage, 440))


def compute_current(load_kW, voltage_V):
    return (load_kW * 1000) / voltage_V

def compute_power(voltage_V, current_A, efficiency=0.95):
    return (voltage_V * current_A * efficiency) / 1000

def update_internal_temperature(prev_temp, power_kW, ambient_temp):
    heat_generated = 0.04 * power_kW
    heat_dissipated = 0.02 * (prev_temp - ambient_temp)
    return max(ambient_temp, min(prev_temp + heat_generated - heat_dissipated, 100))

try:
    while True:
        state["ambient_temperature_C"] = update_ambient_temperature(
            state["ambient_temperature_C"]
        )

        state["charger_load_kW"] = update_load()

        state["charger_output_voltage_V"] = update_voltage(
            state["charger_output_voltage_V"],
            state["charger_load_kW"]
        )

        state["charging_current_A"] = compute_current(
            state["charger_load_kW"],
            state["charger_output_voltage_V"]
        )

        state["charging_power_kW"] = compute_power(
            state["charger_output_voltage_V"],
            state["charging_current_A"]
        )

        state["charger_internal_temperature_C"] = update_internal_temperature(
            state["charger_internal_temperature_C"],
            state["charging_power_kW"],
            state["ambient_temperature_C"]
        )

        print(state)
        time.sleep(5)

except KeyboardInterrupt:
    print("Simulation stopped")