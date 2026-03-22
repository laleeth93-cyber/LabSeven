// --- BLOCK app/results/entry/components/ResultEntryUtils.ts OPEN ---
export const getAgeInDays = (val: number, unit: string) => {
    if (unit === 'Years') return val * 365;
    if (unit === 'Months') return val * 30;
    return val;
};

export const getPatientAgeDays = (patient: any) => {
    const y = patient?.ageY || 0;
    const m = patient?.ageM || 0;
    const d = patient?.ageD || 0;
    return (y * 365) + (m * 30) + d;
};

export const getMatchedRange = (parameter: any, patient: any) => {
    if (!parameter) return null;
    const patientGender = patient?.gender || 'Male';
    const patientDays = getPatientAgeDays(patient);

    if (parameter.ranges && parameter.ranges.length > 0) {
        const match = parameter.ranges.find((r: any) => {
            const genderMatch = r.gender === 'Both' || r.gender === patientGender;
            const minDays = getAgeInDays(r.minAge, r.minAgeUnit);
            const maxDays = getAgeInDays(r.maxAge, r.maxAgeUnit);
            const ageMatch = patientDays >= minDays && patientDays <= maxDays;
            return genderMatch && ageMatch;
        });
        if (match) return match;
    }
    return null; 
};

export const getDisplayRange = (parameter: any, patient: any) => {
    if (!parameter) return '';
    const range = getMatchedRange(parameter, patient);
    
    if (range) {
        if (range.normalRange && range.normalRange.trim() !== '') return range.normalRange;
        if (range.normalValue && range.normalValue.trim() !== '') return range.normalValue;
        if (range.lowRange !== null && range.highRange !== null) return `${range.lowRange} - ${range.highRange}`;
    }

    if (parameter.minVal !== null && parameter.maxVal !== null) {
        return `${parameter.minVal} - ${parameter.maxVal}`;
    }
    return '';
};

export const getFlag = (value: string, parameter: any, patient: any) => {
    if (!value || !parameter) return 'Normal';

    const range = getMatchedRange(parameter, patient);

    if (range && range.abnormalValue) {
        const abnormalValues = range.abnormalValue.split(',').map((v: string) => v.trim().toLowerCase());
        if (abnormalValues.includes(value.trim().toLowerCase())) {
            return 'Abnormal'; 
        }
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal)) return 'Normal';

    let min = parameter.minVal;
    let max = parameter.maxVal;

    if (range) {
        if (range.lowRange !== null && range.lowRange !== undefined) min = range.lowRange;
        if (range.highRange !== null && range.highRange !== undefined) max = range.highRange;
    }

    if (min !== null && min !== undefined && numVal < min) return 'Low';
    if (max !== null && max !== undefined && numVal > max) return 'High';
    
    return 'Normal';
};

export const recalculateFormulas = (currentResults: any, currentFlags: any, billItemId: number, testParameters: any[], patient: any) => {
    const updatedResults = { ...currentResults };
    const updatedFlags = { ...currentFlags };
    let hasChanges = false;

    const paramCodeMap: Record<string, number> = {};
    
    testParameters.forEach(tp => {
        if (!tp.parameter) return;
        const key = `${billItemId}-${tp.parameter.id}`;
        const val = parseFloat(updatedResults[key]);
        if (!isNaN(val) && tp.parameter.code) {
            paramCodeMap[`[${tp.parameter.code}]`] = val;
        }
    });

    testParameters.forEach(tp => {
        if (!tp.parameter) return; 
        if (tp.formula && tp.formula.trim() !== '') {
            let formulaStr = tp.formula;
            const availableCodes = Object.keys(paramCodeMap).sort((a, b) => b.length - a.length);
            let isReady = true;

            for (const codeKey of availableCodes) {
                formulaStr = formulaStr.replaceAll(codeKey, paramCodeMap[codeKey].toString());
            }

            if (/\[.*?\]/.test(formulaStr)) isReady = false; 

            if (isReady) {
                try {
                    const calcValue = new Function('return ' + formulaStr)();
                    
                    if (typeof calcValue === 'number' && !isNaN(calcValue) && isFinite(calcValue)) {
                        const decimals = tp.parameter.decimals !== null ? tp.parameter.decimals : 2;
                        const finalValue = calcValue.toFixed(decimals);
                        const key = `${billItemId}-${tp.parameter.id}`;

                        if (updatedResults[key] !== finalValue) {
                            updatedResults[key] = finalValue;
                            updatedFlags[key] = getFlag(finalValue, tp.parameter, patient); 
                            hasChanges = true;
                        }
                    }
                } catch (err) { }
            }
        }
    });

    return hasChanges ? { results: updatedResults, flags: updatedFlags } : null;
};
// --- BLOCK app/results/entry/components/ResultEntryUtils.ts CLOSE ---