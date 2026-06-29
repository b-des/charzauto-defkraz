import {IconButton, InputAdornment, InputLabel, Paper, styled} from "@mui/material";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import {Close} from "@mui/icons-material";

const Item = styled(Paper)(({theme}) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

function PartsFilter({filterText, onFilterChange, onClear}) {
    return (
        <Item>
            <FormControl variant="outlined" fullWidth>
                <InputLabel htmlFor={`filter-input`}>Пошук деталі</InputLabel>
                <OutlinedInput
                    id={`filter-input`}
                    type={'text'}
                    value={filterText}
                    onChange={onFilterChange}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton onClick={onClear} edge="end">
                                <Close/>
                            </IconButton>
                        </InputAdornment>
                    }
                />
            </FormControl>
        </Item>
    );
}

export default PartsFilter;
