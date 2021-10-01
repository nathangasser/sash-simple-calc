import React, { useState } from 'react';

const App = () => {

    const [sash, setSash] = useState({
        weight: '',
        position: 'top',
        output: ''
    });

    const setOutput = (value = sash.weight, position = sash.position) => {
        const sashweight = parseFloat(value);
        if (!isNaN(sashweight)) {
            let upperRange = 0;
            let lowerRange = 0;
            if (position === 'top') {
                upperRange = sashweight / 2 + .5;
                lowerRange = sashweight / 2;
            } else if (position === 'bottom') {
                upperRange = sashweight / 2;
                lowerRange = sashweight / 2 - .5;
            } else {
                setSash({ ...sash, output: 'Something weird is happening'});
            }
            const output = `${lowerRange.toFixed(2).toString()} - ${upperRange.toFixed(2).toString()}`;
            setSash({...sash, weight: value, position: position, output: output});
        } else {
            setSash({...sash, weight: value, position: position, output: 'Please enter a sash weight'});
        }
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
                                Upper Sash
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
                                Lower Sash
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