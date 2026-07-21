import CheckboxTree from 'react-checkbox-tree';
import {Paper, styled} from "@mui/material";
import {CheckBoxOutlineBlank, CheckBoxOutlined, Settings} from "@mui/icons-material";

import 'react-checkbox-tree/lib/react-checkbox-tree.css';

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

function PartsTree({nodes, checked, expanded, onCheck, onExpand}) {
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
                onClick = {() => {}}
                onCheck={onCheck}
                onExpand={onExpand}
                icons={{
                    check: <CheckBoxOutlined color="primary"/>,
                    uncheck: <CheckBoxOutlineBlank color="primary"/>,
                    leaf: <Settings color="primary"/>
                }}
            />
        </Item>
    );
}

export default PartsTree;
