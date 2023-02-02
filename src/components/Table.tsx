import React, { useState, useCallback, useEffect } from 'react'
import { useLayer } from "react-laag"
import { motion, AnimatePresence } from "framer-motion"
import {
  GridColumn,
  Item,
  GridCell,
  GridCellKind,
  EditableGridCell,
  DataEditor
} from "@glideapps/glide-data-grid"
import type { IBounds } from "react-laag"
import type { GridMouseEventArgs } from "@glideapps/glide-data-grid"
import "@glideapps/glide-data-grid/dist/index.css"

import data from './data/data.json'
const myData = data as any[];

interface colsDataInterface {
	content: any[],
	columns: GridColumn[],
	indexes: string[]
}

const initialData: colsDataInterface = {
	content: myData,
	columns: [
		{
			title: "ID",
			id: "id"
		},
		{
			title: "First name",
			id: "first_name"
		},
		{
			title: "Last name",
			id: "last_name"
		},
		{
			title: "Email",
			id: "email"
		},
		{
			title: "gender",
			id: "gender"
		},
		{
			title: "ip_address",
			id: "ip_address"
		},
		{
			title: "phone",
			id: "phone"
		},
		{
			title: "opt_in",
			id: "opt_in"
		},
		{
			title: "moreInfo",
			id: "moreInfo"
		},
		{
			title: "hired",
			id: "hired"
		},
		{
			title: "level",
			id: "level"
		},
		{
			title: "password",
			id: "password"
		}
	],
	indexes: [
		"id", 
		"first_name", 
		"last_name", 
		"email", 
		"gender", 
		"ip_address", 
		"phone", 
		"opt_in", 
		"moreInfo", 
		"hired", 
		"level", 
		"password"
	]
}

interface dataObjectModel {
	[prop: string]: string,
	"id": string,
    "first_name": string,
    "last_name": string,
    "email": string,
	"gender": string,
	"ip_address": string,
	"phone": string,
	"opt_in": string,
	"moreInfo": string,
	"hired": string,
	"level": string,
	"password": string
}

const columnDataKeys = (model: {}[]) => {
	const firstObject = model[0]
	const cols = Object.keys(firstObject)
	return [...cols]
}

const fillDataModel = (data: dataObjectModel[], iId: string = "") => {
	const sData = columnDataKeys(data) 
	let cId = sData.reduce((k,v) => ({
		...k,
		[v]: ""
	}), {})
	return {
		...cId,
		id: iId
	}
}

const Table = () => {
	const 	[data, setData] = useState<colsDataInterface>(initialData),
			[totalRows, setTotalRows] = useState(initialData.content.length)
	
	const getContent = useCallback(
		(cell: Item): GridCell => {
			const 	[col, row] = cell,
					dataRow = data.content[row],
					d = dataRow[data.indexes[col]]
			return {
				kind: GridCellKind.Text,
				allowOverlay: true,
				readonly: false,
				displayData: d,
				data: d
			};
		},
		[data]
	)
	
	const getCellContentMangled = useCallback(
		([col, row]: Item): GridCell => {
			const remappedCol = data.columns.findIndex(
				(c) => c.title === data.columns[col].title
			);
			return getContent([remappedCol, row]);
		},
		[getContent, data.columns]
	)
	
	const onCellEdited = useCallback(
		(cell: Item, newValue: EditableGridCell) => {
			if (newValue.kind !== GridCellKind.Text) {
			  // we only have text cells, might as well just die here.
			  return
			}

			const 	[col, row] = cell,
					key = data.indexes[col]

			setData({
				...data,
				content: [
					...data.content,
					{
						...data.content[row],
						[key]: newValue.data
					}
				]
			});
		},
		[data]
	)
	
	const zeroBounds = {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
		bottom: 0,
		right: 0,
	}
	
	const [myContextMenu, setMyContextMenu] = useState<{ val: [number, number]; bounds: IBounds } | undefined>()
	const removeMenu = () => setMyContextMenu(undefined)
	
	const onCtMenu = useCallback((args: GridMouseEventArgs) => {
		if (args.kind === "cell") {
			setMyContextMenu({
				val: [args.location[0], args.location[1]],
				bounds: {
					// translate to react-laag types
					left: args.bounds.x,
					top: args.bounds.y,
					width: args.bounds.width,
					height: args.bounds.height,
					right: args.bounds.x + args.bounds.width,
					bottom: args.bounds.y + args.bounds.height,
				},
			});

		} else {
			removeMenu()
		}
	}, [])
	
	const isOpen = myContextMenu !== undefined
	const { renderLayer, layerProps } = useLayer({
		isOpen,
		overflowContainer: true,
        triggerOffset: 8,
		containerOffset: 16,
		arrowOffset: 8,
        auto: true,
		snap: true,
		placement: "right-start",
		possiblePlacements: ["right-start", "left-start"],
        trigger: {
            getBounds: () => myContextMenu?.bounds ?? zeroBounds,
        },
	});
	
	const onCellCkd = React.useCallback(() => {
		removeMenu()
	}, [])
	
	const addNewRow = {
		increaseIndexes: (obj: any, i: number) => ({
			...obj,
			id: (+obj['id']+1).toString()
		}),
		here: (row: [number, number]) => {
			let beforeIndexes = [...data.content].filter((i, index) => +index < (row[1]))
			let afterIndexes = [...data.content].filter((i, index) => +index >= (row[1])).map(addNewRow.increaseIndexes)
			const finalIndexes = [
				...beforeIndexes,
				fillDataModel(data.content, (row[1]+1).toString()),
				...afterIndexes
			]
			setData({
				...data,
				content: finalIndexes
			})
			
			// update rows
			setTotalRows(totalRows+1)
		},
		toTop: () => {
			const increasedIndexes = [...data.content].map(addNewRow.increaseIndexes)
			const fillModel = fillDataModel(data.content, `1`)
			setData({
				...data,
				content: [fillModel, ...increasedIndexes]
			})
			// update rows
			setTotalRows(totalRows+1)
			
			// scroll to
			const cst = document.querySelector('.dvn-scroll-inner')
			cst?.scrollIntoView(true)
		},
		toBottom: () => {
			const fillModel = fillDataModel(data.content, `${totalRows+1}`)
			setData({
				...data,
				content: [
					...data.content, 
					fillModel
				]
			})
			// update rows
			setTotalRows(totalRows+1)
			
			// scroll to
			const cst = document.querySelector('.dvn-scroll-inner')
			cst?.scrollIntoView(false)
		}
	}
	
	const addNewCol = () => {
		const dataNewCol = [...data.content].map((object, index) => ({
			...object,
			"newColumn": ""
		}))
		setData({
			content: dataNewCol,
			columns: [
				...data.columns,
				{
					title: "New column",
					id: "newColumn"
				}
			],
			indexes: [
				...data.indexes,
				"newColumn"
			]
		})
	}

	return (
		<div style={{display: "flex",alignItems: "center", justifyContent: "center", width: "100%", height: "100vh"}}>
			<div style={{ borderRadius: "0.75rem", position: "relative", overflow: "hidden" }}>
				<DataEditor
					theme={{
						'bgCell': '#16161b',
						'textDark': '#fff',
						'bgHeader': '#212121',
						'textHeader': '#b8b8b8',
						'bgHeaderHasFocus': '#16161b',
						'bgHeaderHovered': '#16161b',
					}}
					width={1604} 
					height={600}
					getCellContent={getCellContentMangled} 
					columns={data.columns}
					rows={totalRows}
					onPaste={true}
					onCellEdited={onCellEdited}
					onCellClicked={() => onCellCkd()}
					onHeaderClicked={() => onCellCkd()}
					onGroupHeaderClicked={() => onCellCkd()}
					onHeaderMenuClick={onCellCkd}
					onCellContextMenu={(i, e) => {
						e.preventDefault()
						onCtMenu(e)
					}}
					onRowAppended={addNewRow.toBottom}
				/>
				
				{renderLayer(
						<AnimatePresence>
							{isOpen && (
							<motion.ul
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.85 }}
								transition={{ duration: 0.15 }}
								className="menu"
								key="modal"
								{...layerProps}
								style={{
								   ...layerProps.style,
									padding: "10px 0px",
									color: "white",
									fontSize: "14px",
									textAlign: "left",
									backgroundColor: "#212121",
									listStyle: "none",
									display: "flex",
									flexDirection: "column",
									gap: "0.5rem",
									borderRadius: "0",
									opacity: "0",
									transition: "opacity 3s ease 2s"
								}}>
									<li key="item1" onClick={() => addNewRow.here(myContextMenu.val)} className="menu-item">Add new row</li>
									<li key="item2" onClick={addNewRow.toTop} className="menu-item">Add new row to top</li>
									<li key="item3" onClick={addNewRow.toBottom} className="menu-item">Add new row to bottom</li>
									<li key="item4" onClick={addNewCol} className="menu-item">Add new column</li>
							</motion.ul>
							)}
						</AnimatePresence>
					)
				}
				<div id="portal" style={{position: "fixed", left: "0", top: "0", zIndex: "9999"}} />
			</div>
		</div>
	)
}

export default Table