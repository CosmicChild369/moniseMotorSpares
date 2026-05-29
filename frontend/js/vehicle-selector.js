/**
 * Vehicle selector dropdowns - Year / Make / Model / Engine
 */
async function initVehicleSelector() {
  const yearSel = document.getElementById('veh-year');
  if (!yearSel) return;

  const makeSel = document.getElementById('veh-make');
  const modelSel = document.getElementById('veh-model');
  const engineSel = document.getElementById('veh-engine');
  const clearBtn = document.getElementById('veh-clear');

  try {
    const { years } = await VehiclesAPI.years();
    years.forEach((y) => {
      yearSel.innerHTML += `<option value="${y}">${y}</option>`;
    });
  } catch (e) { console.warn('Vehicle years load failed', e); }

  // Restore saved selection
  const saved = getSelectedVehicle();
  if (saved) await restoreVehicle(saved);

  yearSel.addEventListener('change', async () => {
    makeSel.innerHTML = '<option value="">Make</option>';
    modelSel.innerHTML = '<option value="">Model</option>';
    engineSel.innerHTML = '<option value="">Engine</option>';
    makeSel.disabled = modelSel.disabled = engineSel.disabled = true;
    if (!yearSel.value) return;
    const { makes } = await VehiclesAPI.makes(yearSel.value);
    makes.forEach((m) => { makeSel.innerHTML += `<option value="${m}">${m}</option>`; });
    makeSel.disabled = false;
  });

  makeSel.addEventListener('change', async () => {
    modelSel.innerHTML = '<option value="">Model</option>';
    engineSel.innerHTML = '<option value="">Engine</option>';
    modelSel.disabled = engineSel.disabled = true;
    if (!makeSel.value) return;
    const { models } = await VehiclesAPI.models(yearSel.value, makeSel.value);
    models.forEach((m) => { modelSel.innerHTML += `<option value="${m}">${m}</option>`; });
    modelSel.disabled = false;
  });

  modelSel.addEventListener('change', async () => {
    engineSel.innerHTML = '<option value="">Engine</option>';
    engineSel.disabled = true;
    if (!modelSel.value) return;
    const { engines } = await VehiclesAPI.engines(yearSel.value, makeSel.value, modelSel.value);
    engines.forEach((e) => {
      engineSel.innerHTML += `<option value="${e.engine}" data-id="${e.id}">${e.engine}</option>`;
    });
    engineSel.disabled = false;
  });

  engineSel.addEventListener('change', async () => {
    if (!engineSel.value) return;
    const opt = engineSel.selectedOptions[0];
    const vehicle = {
      id: Number(opt.dataset.id),
      year: Number(yearSel.value),
      make: makeSel.value,
      model: modelSel.value,
      engine: engineSel.value,
      label: `${yearSel.value} ${makeSel.value} ${modelSel.value} ${engineSel.value}`
    };
    setSelectedVehicle(vehicle);
    window.dispatchEvent(new Event('vehicle-selected'));
    // Reload page products if on listing
    if (window.refreshProducts) window.refreshProducts();
  });

  clearBtn?.addEventListener('click', () => {
    setSelectedVehicle(null);
    yearSel.value = '';
    makeSel.innerHTML = '<option value="">Make</option>';
    modelSel.innerHTML = '<option value="">Model</option>';
    engineSel.innerHTML = '<option value="">Engine</option>';
    makeSel.disabled = modelSel.disabled = engineSel.disabled = true;
    window.dispatchEvent(new Event('vehicle-selected'));
    if (window.refreshProducts) window.refreshProducts();
  });
}

async function restoreVehicle(v) {
  const yearSel = document.getElementById('veh-year');
  const makeSel = document.getElementById('veh-make');
  const modelSel = document.getElementById('veh-model');
  const engineSel = document.getElementById('veh-engine');
  if (!yearSel) return;

  yearSel.value = v.year;
  yearSel.dispatchEvent(new Event('change'));
  await new Promise((r) => setTimeout(r, 100));
  makeSel.value = v.make;
  makeSel.dispatchEvent(new Event('change'));
  await new Promise((r) => setTimeout(r, 100));
  modelSel.value = v.model;
  modelSel.dispatchEvent(new Event('change'));
  await new Promise((r) => setTimeout(r, 100));
  engineSel.value = v.engine;
}

/** Build vehicle filter params for API */
function vehicleFilterParams() {
  const v = getSelectedVehicle();
  if (!v) return {};
  return { vehicleId: v.id, year: v.year, make: v.make, model: v.model, engine: v.engine };
}
