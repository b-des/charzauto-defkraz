import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

function ConfirmationDialog({show, proceed, title, description}) {
    return (
        <Dialog
            open={show}
            onClose={() => proceed(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title" color="primary">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {description}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => proceed(true)} color="primary">
                    Так
                </Button>
                <Button onClick={() => proceed(false)} color="primary">
                    Ні
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmationDialog;
