import CustomSelect from "../components/CustomSelect";

const GENDER_OPTIONS = [
  { value: "", label: "Select your gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const ACADEMIC_YEAR_OPTIONS = [
  { value: "", label: "Select your year" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

function BasicInformation({ formData, handleChange, errors }) {
  return (
    <div className="step-content fade-in">
      <div className="form-grid">
        {/* Field 1: Age */}
        <div className={`form-group ${errors.age ? "has-error" : ""}`}>
          <label htmlFor="field-age" id="label-age">
            Age <span className="req">*</span>
          </label>
          <input
            id="field-age"
            type="number"
            name="age"
            min="17"
            max="29"
            step="1"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter your age"
            required
            aria-labelledby="label-age"
          />
          <div className="field-hint">Acceptable range: 17 – 29 years</div>
          {errors.age && <div className="error-message">{errors.age}</div>}
        </div>

        {/* Field 2: Gender (Custom Styled Dropdown) */}
        <div className={`form-group ${errors.gender ? "has-error" : ""}`}>
          <label htmlFor="field-gender" id="label-gender">
            Gender <span className="req">*</span>
          </label>
          <CustomSelect
            id="field-gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={GENDER_OPTIONS}
            placeholder="Select your gender"
            hasError={Boolean(errors.gender)}
            required
            ariaLabelledBy="label-gender"
          />
          <div className="field-hint">Select your identified gender</div>
          {errors.gender && (
            <div className="error-message">{errors.gender}</div>
          )}
        </div>

        {/* Field 3: Academic Year (Custom Styled Dropdown) */}
        <div className={`form-group ${errors.academic_year ? "has-error" : ""}`}>
          <label htmlFor="field-academic_year" id="label-academic_year">
            Academic Year <span className="req">*</span>
          </label>
          <CustomSelect
            id="field-academic_year"
            name="academic_year"
            value={formData.academic_year}
            onChange={handleChange}
            options={ACADEMIC_YEAR_OPTIONS}
            placeholder="Select your year"
            hasError={Boolean(errors.academic_year)}
            required
            ariaLabelledBy="label-academic_year"
          />
          <div className="field-hint">Current year of study (1 to 4)</div>
          {errors.academic_year && (
            <div className="error-message">{errors.academic_year}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BasicInformation;
