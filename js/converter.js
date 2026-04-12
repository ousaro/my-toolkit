// ============================================================
// CONVERTER.JS — Logic for unit converter
// ============================================================

// Conversion data structure
const conversions = {
  length: {
    base: "meter",
    units: {
      meter: 1,
      kilometer: 1000,
      centimeter: 0.01,
      millimeter: 0.001,
      inch: 0.0254,
      foot: 0.3048,
      yard: 0.9144,
      mile: 1609.344
    }
  },
  weight: {
    base: "kilogram",
    units: {
      kilogram: 1,
      gram: 0.001,
      milligram: 0.000001,
      pound: 0.453592,
      ounce: 0.0283495
    }
  },
  temperature: {
    base: "celsius",
    units: {
      celsius: "C",
      fahrenheit: "F",
      kelvin: "K"
    }
  },
  speed: {
    base: "m/s",
    units: {
      "m/s": 1,
      "km/h": 0.277778,
      mph: 0.44704
    }
  },
  volume: {
    base: "liter",
    units: {
      liter: 1,
      milliliter: 0.001,
      gallon: 3.78541, // US gallon
      cup: 0.236588
    }
  },
  area: {
    base: "m²",
    units: {
      "m²": 1,
      "km²": 1000000,
      "ft²": 0.092903,
      acre: 4046.86
    }
  },
  time: {
    base: "seconds",
    units: {
      seconds: 1,
      minutes: 60,
      hours: 3600,
      days: 86400
    }
  }
};

// DOM elements
const categorySelect = document.getElementById('category-select');
const precisionSelect = document.getElementById('precision-select');
const fromValue = document.getElementById('from-value');
const fromUnit = document.getElementById('from-unit');
const toValue = document.getElementById('to-value');
const toUnit = document.getElementById('to-unit');
const swapBtn = document.getElementById('swap-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  updateUnitOptions();
  convert();
  attachEventListeners();
});

// Load last used settings from localStorage
function loadFromLocalStorage() {
  const saved = localStorage.getItem('converter-settings');
  if (saved) {
    const settings = JSON.parse(saved);
    categorySelect.value = settings.category || 'length';
    precisionSelect.value = settings.precision || '4';
    fromValue.value = settings.fromValue || '1';
    fromUnit.value = settings.fromUnit || '';
    toUnit.value = settings.toUnit || '';
  }
}

// Save settings to localStorage
function saveToLocalStorage() {
  const settings = {
    category: categorySelect.value,
    precision: precisionSelect.value,
    fromValue: fromValue.value,
    fromUnit: fromUnit.value,
    toUnit: toUnit.value
  };
  localStorage.setItem('converter-settings', JSON.stringify(settings));
}

// Update unit options based on selected category
function updateUnitOptions() {
  const category = categorySelect.value;
  const units = Object.keys(conversions[category].units);

  fromUnit.innerHTML = '';
  toUnit.innerHTML = '';

  units.forEach(unit => {
    const option1 = document.createElement('option');
    option1.value = unit;
    option1.textContent = unit;
    fromUnit.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = unit;
    option2.textContent = unit;
    toUnit.appendChild(option2);
  });

  // Set default units if not set
  if (!fromUnit.value) {
    fromUnit.value = units[0];
  }
  if (!toUnit.value) {
    toUnit.value = units[1] || units[0];
  }
}

// Convert temperature (special case)
function convertTemperature(value, from, to) {
  let celsius;
  // Convert to Celsius first
  if (from === 'celsius') {
    celsius = value;
  } else if (from === 'fahrenheit') {
    celsius = (value - 32) * 5/9;
  } else if (from === 'kelvin') {
    celsius = value - 273.15;
  }

  // Convert from Celsius to target
  if (to === 'celsius') {
    return celsius;
  } else if (to === 'fahrenheit') {
    return celsius * 9/5 + 32;
  } else if (to === 'kelvin') {
    return celsius + 273.15;
  }
}

// General conversion function
function convertValue(value, from, to, category) {
  if (category === 'temperature') {
    return convertTemperature(value, from, to);
  }

  const base = conversions[category].base;
  const fromFactor = conversions[category].units[from];
  const toFactor = conversions[category].units[to];

  // Convert to base unit, then to target unit
  const inBase = value * fromFactor;
  const result = inBase / toFactor;

  return result;
}

// Perform conversion
function convert() {
  const value = parseFloat(fromValue.value);
  if (isNaN(value)) {
    toValue.value = '';
    return;
  }

  const from = fromUnit.value;
  const to = toUnit.value;
  const category = categorySelect.value;
  const precision = parseInt(precisionSelect.value);

  if (from === to) {
    toValue.value = value.toFixed(precision);
    return;
  }

  const result = convertValue(value, from, to, category);
  toValue.value = result.toFixed(precision);

  saveToLocalStorage();
}

// Swap units
function swapUnits() {
  const tempUnit = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = tempUnit;
  convert();
}

// Attach event listeners
function attachEventListeners() {
  categorySelect.addEventListener('change', () => {
    updateUnitOptions();
    convert();
  });

  precisionSelect.addEventListener('change', convert);
  fromValue.addEventListener('input', convert);
  fromUnit.addEventListener('change', convert);
  toUnit.addEventListener('change', convert);
  swapBtn.addEventListener('click', swapUnits);
}