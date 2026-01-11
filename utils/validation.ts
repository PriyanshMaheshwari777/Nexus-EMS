export const ValidationRules = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^\d{10}$/,
    name: /^[a-zA-Z\s]{2,50}$/, // Only letters and spaces, 2-50 chars
    salary: /^\d+$/, // Positive integers
};

export const validateEmployee = (emp: any) => {
    const errors: string[] = [];

    if (!ValidationRules.name.test(emp.full_name)) {
        errors.push("Full Name must contain only letters and be 2-50 characters long.");
    }
    if (!ValidationRules.email.test(emp.email)) {
        errors.push("Invalid Email Address format.");
    }
    if (!ValidationRules.phone.test(emp.phone)) {
        errors.push("Phone Number must be exactly 10 digits.");
    }
    if (emp.salary <= 0) {
        errors.push("Salary must be a positive number.");
    }

    return errors;
};
