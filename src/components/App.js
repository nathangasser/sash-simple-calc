import React, { useState, useEffect } from 'react';

const App = () => {
    const [sash, setSash] = useState({
        weight: '',
        position: 'top',
        output: ''
    });

    const [useBushings, setUseBushings] = useState(false);

    const setOutput = (value = sash.weight, position = sash.position) => {
        const sashWeight = parseFloat(value);
        if (!isNaN(sashWeight)) {
            let upperRange = 0;
            let lowerRange = 0;

            // Adjust values based on whether the checkbox is checked
            const reductionFactor = useBushings ? 0.6 : 1;

            if (position === 'bottom') {
                upperRange = sashWeight / 2 * reductionFactor + 0.5;
                lowerRange = sashWeight / 2 * reductionFactor;
            } else if (position === 'top') {
                upperRange = sashWeight / 2 * reductionFactor;
                lowerRange = sashWeight / 2 * reductionFactor - 0.5;
            } else {
                setSash({ ...sash, output: 'Something weird is happening' });
                return;
            }

            const output = `${(lowerRange.toFixed(2) * 1).toString()} - ${(upperRange.toFixed(2) * 1).toString()}`;
            setSash({ ...sash, weight: value, position: position, output: output });
        } else {
            setSash({ ...sash, weight: value, position: position, output: 'Please enter a sash weight' });
        }
    };

    useEffect(() => {
        // Use useEffect to trigger setOutput after the state is updated
        setOutput(sash.weight, sash.position);
    }, [useBushings, sash.weight, sash.position]);

    const handleCheckboxChange = () => {
        setUseBushings(!useBushings);
    };

    return (
        <div className="row p-4 pb-0 pt-lg-5 align-items-center rounded-3 border shadow-lg">
            <div className="col-lg-7 p-3 p-lg-5 pt-lg-3">
                <h1 className="display-6 fw-bold lh-1">Counterweight Calculator</h1>
                <form>
                    <div className="d-grid mb-3 d-sm-flex">
                        <input
                            type="text"
                            className="form-control"
                            id="sashWeight"
                            placeholder="Sash Weight"
                            value={sash.weight}
                            onChange={(e) => {
                                setOutput(e.target.value);
                            }}
                        />
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="top"
                            id="flexRadioDefault1"
                            checked={sash.position === 'top'}
                            onChange={(e) => {
                                setOutput(sash.weight, e.target.name);
                            }}
                        />
                        <label className="form-check-label" htmlFor="flexRadioDefault1">
                            Lower Sash
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="bottom"
                            id="flexRadioDefault2"
                            checked={sash.position === 'bottom'}
                            onChange={(e) => {
                                setOutput(sash.weight, e.target.name);
                            }}
                        />
                        <label className="form-check-label" htmlFor="flexRadioDefault2">
                            Upper Sash
                        </label>
                    </div>
                    <div className="form-check my-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="useBushings"
                            checked={useBushings}
                            onChange={handleCheckboxChange}
                        />
                        <label className="form-check-label" htmlFor="useBushings">
                            Bushings 60%
                        </label>
                    </div>
                    <div className="d-grid d-md-flex my-3">
                        <h1>{sash.output === '' ? 'Please enter a sash weight' : sash.output}</h1>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default App;
