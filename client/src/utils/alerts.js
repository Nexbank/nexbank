import Swal from "sweetalert2";

const baseOptions = {
  background: "#111111",
  color: "#f8fafc",
  confirmButtonColor: "#10c58d",
  cancelButtonColor: "#2b2f36",
  reverseButtons: true,
};

export const showSuccessAlert = (title, text = "") =>
  Swal.fire({
    ...baseOptions,
    icon: "success",
    title,
    text,
  });

export const showErrorAlert = (title, text = "") =>
  Swal.fire({
    ...baseOptions,
    icon: "error",
    title,
    text,
  });

export const showInfoAlert = (title, text = "") =>
  Swal.fire({
    ...baseOptions,
    icon: "info",
    title,
    text,
  });

export const showSuccessToast = (title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
    ...baseOptions,
    icon: "success",
    title,
  });

export const showErrorToast = (title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 2800,
    timerProgressBar: true,
    showConfirmButton: false,
    ...baseOptions,
    icon: "error",
    title,
  });

export const showConfirmationAlert = ({
  title,
  text,
  html,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  icon = "warning",
}) =>
  Swal.fire({
    ...baseOptions,
    icon,
    title,
    text,
    html,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    focusCancel: true,
  });
