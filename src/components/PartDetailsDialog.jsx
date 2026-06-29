import {useState, useEffect, useMemo} from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import NumberSpinner from "./NumberSpinner.jsx";

function PartDetailsDialog({open, partLabel, partValue, maxQuantity, initialValues, onApply, onCancel}) {
    const [replace, setReplace] = useState(0);
    const [repair, setRepair] = useState(0);
    const [missing, setMissing] = useState(0);

    useEffect(() => {
        if (open) {
            setReplace(initialValues?.replace ?? 0);
            setRepair(initialValues?.repair ?? 0);
            setMissing(initialValues?.missing ?? 0);
        }
    }, [open, initialValues]);

    const total = replace + repair + missing;
    const remaining = maxQuantity - total;
    const isValid = total > 0 && total <= maxQuantity;

    const handleApply = () => {
        onApply({replace, repair, missing});
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{color: '#000'}}>Деталізація</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{mb: 0.5}}>{partLabel}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    {partValue?.split('#')[0]} &middot; Кількість на авто: {maxQuantity}
                </Typography>

                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>На заміну</Typography>
                        <NumberSpinner
                            min={0}
                            max={maxQuantity}
                            size="small"
                            value={replace}
                            onValueChange={(v) => setReplace(v ?? 0)}
                            onValueCommitted={(v) => setReplace(v ?? 0)}
                        />
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>На ремонт</Typography>
                        <NumberSpinner
                            min={0}
                            max={maxQuantity}
                            size="small"
                            value={repair}
                            onValueChange={(v) => setRepair(v ?? 0)}
                            onValueCommitted={(v) => setRepair(v ?? 0)}
                        />
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>Відсутні</Typography>
                        <NumberSpinner
                            min={0}
                            max={maxQuantity}
                            size="small"
                            value={missing}
                            onValueChange={(v) => setMissing(v ?? 0)}
                            onValueCommitted={(v) => setMissing(v ?? 0)}
                        />
                    </Stack>
                </Stack>

                <Typography
                    variant="body2"
                    sx={{mt: 2}}
                    color={remaining < 0 ? 'error' : 'text.secondary'}
                >
                    Залишок у робочому стані: {remaining < 0 ? 0 : remaining} з {maxQuantity}
                    {remaining < 0 && ' (перевищено!)'}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">Скасувати</Button>
                <Button onClick={handleApply} variant="contained" disabled={!isValid}>
                    Застосувати
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PartDetailsDialog;
