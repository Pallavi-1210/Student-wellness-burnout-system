function DailyLifestyle({ formData, handleChange, errors }) {
  return (
    <div className="step-content fade-in">
      <div className="form-grid">
        <div
          className={`form-group ${errors.sleep_hours ? "has-error" : ""}`}
        >
          <label htmlFor="field-sleep_hours">
            Sleep Hours Per Day <span className="req">*</span>
          </label>
          <input
            id="field-sleep_hours"
            type="number"
            name="sleep_hours"
            min="3"
            max="10"
            step="0.1"
            value={formData.sleep_hours}
            onChange={handleChange}
            placeholder="Example: 7.5 hours"
            required
          />
          <div className="field-hint">Nightly rest duration (3 – 10 hrs)</div>
          {errors.sleep_hours && (
            <div className="error-message">{errors.sleep_hours}</div>
          )}
        </div>

        <div
          className={`form-group ${
            errors.physical_activity ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-physical_activity">
            Physical Activity Hours Per Day <span className="req">*</span>
          </label>
          <input
            id="field-physical_activity"
            type="number"
            name="physical_activity"
            min="0"
            max="7"
            step="0.1"
            value={formData.physical_activity}
            onChange={handleChange}
            placeholder="Example: 1.5 hours"
            required
          />
          <div className="field-hint">Daily exercise or sports (0 – 7 hrs)</div>
          {errors.physical_activity && (
            <div className="error-message">
              {errors.physical_activity}
            </div>
          )}
        </div>

        <div
          className={`form-group ${errors.screen_time ? "has-error" : ""}`}
        >
          <label htmlFor="field-screen_time">
            Screen Time Hours Per Day <span className="req">*</span>
          </label>
          <input
            id="field-screen_time"
            type="number"
            name="screen_time"
            min="1"
            max="12"
            step="0.1"
            value={formData.screen_time}
            onChange={handleChange}
            placeholder="Example: 5.5 hours"
            required
          />
          <div className="field-hint">Total device usage (1 – 12 hrs)</div>
          {errors.screen_time && (
            <div className="error-message">{errors.screen_time}</div>
          )}
        </div>

        <div
          className={`form-group ${
            errors.internet_usage ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-internet_usage">
            Internet Usage Hours Per Day <span className="req">*</span>
          </label>
          <input
            id="field-internet_usage"
            type="number"
            name="internet_usage"
            min="1"
            max="13.78"
            step="0.01"
            value={formData.internet_usage}
            onChange={handleChange}
            placeholder="Example: 6.5 hours"
            required
          />
          <div className="field-hint">Daily online browsing (1 – 13.78 hrs)</div>
          {errors.internet_usage && (
            <div className="error-message">{errors.internet_usage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyLifestyle;
