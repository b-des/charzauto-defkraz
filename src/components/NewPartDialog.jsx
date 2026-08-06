import {useState} from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import NumberSpinner from "./NumberSpinner.jsx";

const MAX_QUANTITY = 999;

function NewPartDialog({open, onApply, onCancel}) {
    const [partName, setPartName] = useState('');
    const [catalogNumber, setCatalogNumber] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [replace, setReplace] = useState(0);
    const [repair, setRepair] = useState(0);
    const [missing, setMissing] = useState(0);

    const total = replace + repair + missing;
    const remaining = quantity - total;
    const isValid = partName.trim() && catalogNumber.trim() && quantity > 0 && total > 0 && total <= quantity;

    const handleApply = () => {
        onApply({
            partName: partName.trim(),
            catalogNumber: catalogNumber.trim(),
            quantity,
            replace,
            repair,
            missing,
        });
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{color: '#000'}}>Додати запасну частину</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{pt: 1}}>
                    <TextField
                        label="Назва деталі"
                        value={partName}
                        onChange={(event) => setPartName(event.target.value)}
                        required
                        autoFocus
                        fullWidth
                    />
                    <TextField
                        label="Номер в каталозі"
                        value={catalogNumber}
                        onChange={(event) => setCatalogNumber(event.target.value)}
                        required
                        fullWidth
                    />
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>Кількість</Typography>
                        <NumberSpinner min={1} max={MAX_QUANTITY} size="small" value={quantity}
                                       onValueChange={(value) => setQuantity(value ?? 1)}
                                       onValueCommitted={(value) => setQuantity(value ?? 1)}/>
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>На заміну</Typography>
                        <NumberSpinner min={0} max={quantity} size="small" value={replace}
                                       onValueChange={(value) => setReplace(value ?? 0)}
                                       onValueCommitted={(value) => setReplace(value ?? 0)}/>
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>На ремонт</Typography>
                        <NumberSpinner min={0} max={quantity} size="small" value={repair}
                                       onValueChange={(value) => setRepair(value ?? 0)}
                                       onValueCommitted={(value) => setRepair(value ?? 0)}/>
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>Відсутні</Typography>
                        <NumberSpinner min={0} max={quantity} size="small" value={missing}
                                       onValueChange={(value) => setMissing(value ?? 0)}
                                       onValueCommitted={(value) => setMissing(value ?? 0)}/>
                    </Stack>
                </Stack>
                <Typography variant="body2" sx={{mt: 2}} color={remaining < 0 ? 'error' : 'text.secondary'}>
                    Залишок у робочому стані: {Math.max(remaining, 0)} з {quantity}
                    {remaining < 0 && ' (перевищено!)'}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">Скасувати</Button>
                <Button onClick={handleApply} variant="contained" disabled={!isValid}>Застосувати</Button>
            </DialogActions>
        </Dialog>
    );
}

export default NewPartDialog;
