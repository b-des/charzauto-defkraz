import CheckboxTree from 'react-checkbox-tree';
import {Paper, styled} from "@mui/material";
import {CheckBoxOutlineBlank, CheckBoxOutlined, Folder, FolderOpen, Settings} from "@mui/icons-material";

import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import {confirmable, createConfirmation} from "react-confirm";
import ConfirmationDialog from "./ConfirmationDialog.jsx";

const Item = styled(Paper)(({theme}) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

function PartsTree({nodes, checked, expanded, onCheck, onExpand}) {
    const showDeleteConfirmation = createConfirmation(confirmable(ConfirmationDialog));

    const onCheck1 = async (values) => {
        const newValues = values.filter(v => !checked.includes(v));
        if (newValues.length > 0) {
            onCheck(values);
            return;
        }
        showDeleteConfirmation({
            title: 'Підтвердіть дію',
            description: 'Видалити елемент зі списку?',
        }).then(confirmed => {
            if (confirmed) {
                onCheck(values)
            }
        });
    }
    return (
        <Item>
            <CheckboxTree
                onlyLeafCheckboxes={true}
                showExpandAll={true}
                showNodeTitle={false}
                checked={checked}
                expanded={expanded}
                nodes={nodes}
                expandOnClick={true}
                onClick={() => {
                }}
                onCheck={onCheck1}
                onExpand={onExpand}
                icons={{
                    parentClose: <Folder color="primary"/>,
                    parentOpen: <FolderOpen color="primary"/>,
                    check: <CheckBoxOutlined color="primary"/>,
                    uncheck: <CheckBoxOutlineBlank color="primary"/>,
                    leaf: null
                }}
            />
        </Item>
    );
}

export default PartsTree;
